import { useState, useContext, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from '../../../contexts/CartContext';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useFilter, CATEGORY_KEYWORDS } from '../../../contexts/FilterContext';
import { AuthContext } from '../../../contexts/AuthContext';

function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
  }
  return url;
}

function getAllImageUrls(url: string | null | undefined): string[] {
  if (!url) return [];
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(u => !!u);
    } catch (_) {}
  }
  return [url];
}

export default function useProductDetailScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addToCart } = useContext(CartContext);
  const { searchText, setSearchText } = useFilter();
  const { user } = useContext(AuthContext);
  const [clientName, setClientName] = useState('');
  const [dismissAlert, setDismissAlert] = useState(false);

  const product = route.params?.product;
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const [photos, setPhotos] = useState<string[]>(() => getAllImageUrls(product?.image_url));
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (product?.image_url) {
      setPhotos(getAllImageUrls(product.image_url));
      setCurrentPhotoIndex(0);
    } else if (product?.id) {
      // Dynamic fetch if image_url is missing
      const fetchImage = async () => {
        try {
          const { data } = await supabase.from('products').select('image_url').eq('id', product.id).single();
          if (data?.image_url) {
            product.image_url = data.image_url;
            setPhotos(getAllImageUrls(data.image_url));
          }
        } catch (e) {
          console.log('Error fetching image_url:', e);
        }
      };
      fetchImage();
    }
  }, [product]);

  useEffect(() => {
    if (!product?.id) return;

    const fetchStock = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('stock')
          .eq('id', product.id)
          .single();

        if (data && !error) {
          setStock(data.stock);
        }
      } catch (err) {
        console.error('Erro ao buscar estoque:', err);
      }
    };

    fetchStock();

    const channel = supabase
      .channel(`product_stock_${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`,
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.stock === 'number') {
            setStock(payload.new.stock);
          }
        }
      )
      .subscribe();

    const intervalId = setInterval(() => {
      fetchStock();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [product?.id]);

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user?.id) {
        try {
          const { data } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();
          if (data?.name) {
            const firstName = data.name.trim().split(' ')[0];
            setClientName(firstName);
          }
        } catch (e) {
          console.log('Erro ao buscar nome do cliente para a saudação:', e);
        }
      }
    };
    fetchProfileName();
  }, [user?.id]);

  const fetchRelatedProducts = async () => {
    try {
      setLoadingRelated(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, stock, active, category_id, created_at')
        .eq('active', true)
        .neq('id', product.id);

      if (!error && data) {
        const currentName = (product.name || '').toLowerCase();
        const currentDesc = (product.description || '').toLowerCase();
        let matchedKeywords: string[] = [];

        for (const [_cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (keywords.some(kw => currentName.includes(kw.toLowerCase()) || currentDesc.includes(kw.toLowerCase()))) {
            matchedKeywords = [...matchedKeywords, ...keywords];
          }
        }

        let filtered = data.filter(p => {
          const name = (p.name || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          return matchedKeywords.some(kw =>
            name.includes(kw.toLowerCase()) ||
            description.includes(kw.toLowerCase())
          );
        });

        if (filtered.length === 0) {
          const cleanText = `${currentName} ${currentDesc}`
            .replace(/[^\w\sà-úÀ-Ú]/g, '')
            .toLowerCase();
          const words = cleanText
            .split(/\s+/)
            .filter((w: string) => w.length > 3);

          filtered = data.filter(p => {
            const name = (p.name || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            return words.some((w: string) =>
              name.includes(w) ||
              description.includes(w)
            );
          });
        }

        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingRelated(false);
    }
  };

  useEffect(() => {
    fetchRelatedProducts();
  }, [product]);

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return {
    colors,
    isDarkMode,
    navigation,
    product,
    stock,
    quantity,
    increment,
    decrement,
    handleAddToCart,
    relatedProducts,
    loadingRelated,
    photos,
    currentPhotoIndex,
    setCurrentPhotoIndex,
    dismissAlert,
    setDismissAlert,
    clientName,
    searchText,
    setSearchText,
    getFirstImageUrl,
    addToCart,
  };
}
