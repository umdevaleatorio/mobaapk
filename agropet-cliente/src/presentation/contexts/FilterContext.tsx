import React, { createContext, useState, useContext } from 'react';

interface FilterContextType {
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  clearFilters: () => void;
}

export const FilterContext = createContext<FilterContextType>({
  selectedCategories: [],
  toggleCategory: () => { },
  searchText: '',
  setSearchText: () => { },
  clearFilters: () => { },
});

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Ração': ['ração', 'cachorro', 'cachorros', 'canino', 'caninos', 'felino', 'felinos', 'racao', 'dog chow', 'pedigree', 'besser', 'purina', 'whiskas', 'granplus', 'premium', 'cão', 'cães', 'gato', 'gatos', 'vaca', 'porco', 'frango', 'galinha', 'galinhas'],
  'Pesca': ['pesca', 'vara', 'anzol', 'linha', 'molinete', 'boia', 'bóia', 'isca', 'carretilha', 'pescaria'],
  'Sementes': ['semente', 'semeadura', 'sementes', 'girassol', 'milho', 'alpiste', 'grão', 'grãos', 'erva', 'ervas', 'erva-doce', 'ervadoce'],
  'Adubo': ['adubo', 'fertilizante', 'terra', 'substrato', 'humus', 'húmus', 'calpiso', 'calcario']
};

export function getProductCategory(product: any): string | null {
  if (!product) return null;
  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword.toLowerCase()) || description.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

export function isProductInCategories(product: any, selected: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  if (!product) return false;
  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();

  return selected.some(category => {
    const keywords = CATEGORY_KEYWORDS[category] || [category.toLowerCase()];
    return keywords.some(keyword =>
      name.includes(keyword.toLowerCase()) ||
      description.includes(keyword.toLowerCase())
    );
  });
}

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchText, setSearchTextState] = useState<string>('');

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const setSearchText = (text: string) => {
    setSearchTextState(text);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchTextState('');
  };

  return (
    <FilterContext.Provider value={{
      selectedCategories,
      toggleCategory,
      searchText,
      setSearchText,
      clearFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
