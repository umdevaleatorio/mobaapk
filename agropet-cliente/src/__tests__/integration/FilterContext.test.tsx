import React, { useContext } from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, Button, View } from 'react-native';
import {
  FilterContext,
  FilterProvider,
  useFilter,
  getProductCategory,
  isProductInCategories,
  CATEGORY_KEYWORDS
} from '../../presentation/contexts/FilterContext';

function FilterConsumer() {
  const { selectedCategories, toggleCategory, searchText, setSearchText, clearFilters } = useFilter();

  return (
    <View>
      <Text testID="search-text">{searchText}</Text>
      <Text testID="categories-count">{selectedCategories.length}</Text>
      {selectedCategories.map(cat => (
        <Text key={cat} testID={`selected-${cat}`}>{cat}</Text>
      ))}
      <Button title="Toggle Ração" onPress={() => toggleCategory('Ração')} />
      <Button title="Toggle Pesca" onPress={() => toggleCategory('Pesca')} />
      <Button title="Set Search" onPress={() => setSearchText('purina')} />
      <Button title="Clear" onPress={() => clearFilters()} />
    </View>
  );
}

describe('FilterContext & Helper Functions', () => {
  describe('getProductCategory', () => {
    it('should return null for undefined/null products', () => {
      expect(getProductCategory(null)).toBeNull();
      expect(getProductCategory(undefined)).toBeNull();
    });

    it('should correctly match keywords in name or description case insensitively', () => {
      // Test Ração
      expect(getProductCategory({ name: 'Ração de Cachorro Premium', description: '' })).toBe('Ração');
      expect(getProductCategory({ name: '', description: 'purina pro plan' })).toBe('Ração');

      // Test Pesca
      expect(getProductCategory({ name: 'Vara de molinete carbono', description: '' })).toBe('Pesca');

      // Test Sementes
      expect(getProductCategory({ name: 'Semente de Girassol', description: '' })).toBe('Sementes');

      // Test Adubo
      expect(getProductCategory({ name: 'Húmus de minhoca', description: '' })).toBe('Adubo');

      // Test no match
      expect(getProductCategory({ name: 'Produto Aleatório', description: 'Nenhum match' })).toBeNull();
    });
  });

  describe('isProductInCategories', () => {
    it('should return true if no categories are selected', () => {
      expect(isProductInCategories({ name: 'Vara' }, [])).toBe(true);
      expect(isProductInCategories({ name: 'Vara' }, null as any)).toBe(true);
    });

    it('should return false if product is null', () => {
      expect(isProductInCategories(null, ['Ração'])).toBe(false);
    });

    it('should return true if product matches keywords of any selected category', () => {
      const prodRacao = { name: 'purina dog', description: '' };
      const prodPesca = { name: 'carretilha metal', description: '' };
      const selected = ['Ração', 'Pesca'];

      expect(isProductInCategories(prodRacao, selected)).toBe(true);
      expect(isProductInCategories(prodPesca, selected)).toBe(true);
      expect(isProductInCategories({ name: 'Semente' }, selected)).toBe(false);
    });

    it('should fallback to lowercase category name if not defined in keywords dictionary', () => {
      // For a custom category e.g. "Brinquedos", keywords fallback to ["brinquedos"]
      expect(isProductInCategories({ name: 'Brinquedos Gato', description: '' }, ['Brinquedos'])).toBe(true);
      expect(isProductInCategories({ name: 'Outro', description: '' }, ['Brinquedos'])).toBe(false);
    });

    it('should match correctly if product name is missing or falsy', () => {
      expect(isProductInCategories({ description: 'purina dog' }, ['Ração'])).toBe(true);
    });
  });

  describe('FilterProvider & useFilter', () => {
    it('should toggle categories, set search text and clear filters', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <FilterProvider>
          <FilterConsumer />
        </FilterProvider>
      );

      // Verify defaults
      expect(getByTestId('search-text').props.children).toBe('');
      expect(getByTestId('categories-count').props.children).toBe(0);

      // Toggle Ração
      await act(async () => {
        fireEvent.press(getByText('Toggle Ração'));
      });
      expect(getByTestId('categories-count').props.children).toBe(1);
      expect(getByTestId('selected-Ração')).toBeTruthy();

      // Toggle Pesca (now multiple selected)
      await act(async () => {
        fireEvent.press(getByText('Toggle Pesca'));
      });
      expect(getByTestId('categories-count').props.children).toBe(2);
      expect(getByTestId('selected-Pesca')).toBeTruthy();

      // Toggle Ração again (removes it)
      await act(async () => {
        fireEvent.press(getByText('Toggle Ração'));
      });
      expect(getByTestId('categories-count').props.children).toBe(1);
      expect(queryByTestId('selected-Ração')).toBeNull();

      // Set Search text
      await act(async () => {
        fireEvent.press(getByText('Set Search'));
      });
      expect(getByTestId('search-text').props.children).toBe('purina');

      // Clear Filters
      await act(async () => {
        fireEvent.press(getByText('Clear'));
      });
      expect(getByTestId('search-text').props.children).toBe('');
      expect(getByTestId('categories-count').props.children).toBe(0);
    });

    it('should cover default createContext values', () => {
      let defaultContextVal: any;
      function DummyConsumer() {
        defaultContextVal = useFilter();
        return null;
      }
      render(<DummyConsumer />);
      defaultContextVal.toggleCategory('cat');
      defaultContextVal.setSearchText('search');
      defaultContextVal.clearFilters();
    });
  });
});
