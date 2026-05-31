import { useState, useEffect } from 'react';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useTrackingScreen() {
  const { toggleMenu } = useUserMenu();
  const [searchText, setSearchText] = useState('');
  const { isDarkMode, colors } = useTheme();
  const [deliveryActive, setDeliveryActive] = useState(true);

  useEffect(() => {
    const fetchDeliveryStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('delivery_active')
          .maybeSingle();
        if (data && !error && data.delivery_active !== undefined) {
          setDeliveryActive(data.delivery_active);
        }
      } catch (e) {
        console.log('Error fetching delivery active in tracking:', e);
      }
    };

    fetchDeliveryStatus();

    const channel = supabase
      .channel('store_settings_tracking_tabs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (payload.new && (payload.new as any).delivery_active !== undefined) {
            setDeliveryActive((payload.new as any).delivery_active);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    toggleMenu,
    searchText,
    setSearchText,
    isDarkMode,
    colors,
    deliveryActive,
  };
}
