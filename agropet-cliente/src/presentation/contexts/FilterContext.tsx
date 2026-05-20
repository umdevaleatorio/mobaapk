import React, { createContext, useState, useContext } from 'react';

interface FilterContextType {
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType>({
  selectedCategories: [],
  toggleCategory: () => {},
  searchText: '',
  setSearchText: () => {},
  clearFilters: () => {},
});

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Ração': ['ração', 'racao', 'dog chow', 'pedigree', 'besser', 'purina', 'whiskas', 'granplus', 'premium'],
  'Pesca': ['pesca', 'vara', 'anzol', 'linha', 'molinete', 'boia', 'isca', 'carretilha'],
  'Sementes': ['semente', 'semeadura', 'sementes', 'girassol', 'milho', 'alpiste'],
  'Adubo': ['adubo', 'fertilizante', 'terra', 'substrato', 'humus', 'húmus', 'calpiso', 'calcario']
};

export function getProductCategory(name: string): string | null {
  const normalized = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category;
    }
  }
  return null;
}

export function isProductInCategories(productName: string, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const normalized = productName.toLowerCase();
  return selected.some(category => {
    const keywords = CATEGORY_KEYWORDS[category] || [category.toLowerCase()];
    return keywords.some(keyword => normalized.includes(keyword));
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
