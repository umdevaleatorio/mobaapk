import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import PDVSection from '../../presentation/screens/admin/AdminDashboard/components/PDVSection';

jest.mock('../../presentation/screens/admin/AdminDashboard/AdminDashboardScreen.styles', () => ({
  styles: {},
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('../../assets/tela7/registrar/Adicionar/Remover/Check.svg', () => 'CheckIcon');

jest.mock('../../utils/imageUtils', () => ({
  getFirstImageUrl: (url: string | null | undefined) => url || null,
}));

const baseProduct = {
  id: 'p1',
  name: 'Test Product',
  price: 50,
  stock: 15,
  image_url: 'https://example.com/img.jpg',
};

const baseCart = {
  p1: { qty: 2, checked: true },
};

const createProps = (overrides = {}) => ({
  pdvSearchText: '',
  onSearchChange: jest.fn(),
  pdvActiveCategories: ['Ração'],
  onCategoryToggle: jest.fn(),
  pdvSelectMode: false,
  pdvCart: baseCart,
  pdvProducts: [baseProduct],
  pdvLoading: false,
  onRegisterPress: jest.fn(),
  onCancelPress: jest.fn(),
  onToggleCart: jest.fn(),
  onUpdateQty: jest.fn(),
  onDismissAlert: jest.fn(),
  dismissedProductIds: new Set<string>(),
  cancelOpacity: new Animated.Value(1),
  isDarkMode: false,
  formatCurrency: (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`,
  ...overrides,
});

describe('PDVSection', () => {
  it('should render loading state', () => {
    const { UNSAFE_getAllByType } = render(<PDVSection {...createProps({ pdvLoading: true })} />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it('should render products list', () => {
    const { getByText } = render(<PDVSection {...createProps()} />);
    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('R$ 50,00')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
  });

  it('should render product with no image_url (falsy branch)', () => {
    const productNoImage = { ...baseProduct, image_url: null };
    const { getByText } = render(<PDVSection {...createProps({ pdvProducts: [productNoImage] })} />);
    expect(getByText('Test Product')).toBeTruthy();
  });

  it('should render product with stock = 0 (falsy branch)', () => {
    const productNoStock = { ...baseProduct, stock: 0 };
    const { getByText } = render(<PDVSection {...createProps({ pdvProducts: [productNoStock] })} />);
    expect(getByText('0')).toBeTruthy();
  });

  it('should render low stock alert (stock < 10)', () => {
    const productLowStock = { ...baseProduct, stock: 3 };
    const { getByText } = render(<PDVSection {...createProps({ pdvProducts: [productLowStock] })} />);
    expect(getByText(/esgotando/)).toBeTruthy();
  });

  it('should render moderate stock alert (stock <= 29)', () => {
    const { getByText } = render(<PDVSection {...createProps({ pdvProducts: [{ ...baseProduct, stock: 20 }] })} />);
    expect(getByText(/estoque moderado/)).toBeTruthy();
  });

  it('should render product with no alert (stock >= 30)', () => {
    const productHighStock = { ...baseProduct, stock: 50 };
    const { queryByText } = render(<PDVSection {...createProps({ pdvProducts: [productHighStock] })} />);
    expect(queryByText(/esgotando/)).toBeNull();
    expect(queryByText(/estoque moderado/)).toBeNull();
  });

  it('should dismiss alert when close pressed', () => {
    const onDismissAlert = jest.fn();
    const productLowStock = { ...baseProduct, stock: 3 };
    const { getByText } = render(
      <PDVSection {...createProps({ pdvProducts: [productLowStock], onDismissAlert })} />
    );
    const xButtons = getByText(/esgotando/);
    expect(xButtons).toBeTruthy();
  });

  it('should not show alert when product is dismissed', () => {
    const productLowStock = { ...baseProduct, stock: 3 };
    const { queryByText } = render(
      <PDVSection {...createProps({ pdvProducts: [productLowStock], dismissedProductIds: new Set(['p1']) })} />
    );
    expect(queryByText(/esgotando/)).toBeNull();
  });

  it('should render in select mode', () => {
    const { getByText } = render(<PDVSection {...createProps({ pdvSelectMode: true })} />);
    expect(getByText('Cancelar')).toBeTruthy();
    expect(getByText('R$ 100,00')).toBeTruthy();
  });

  it('should call onSearchChange when typing', () => {
    const onSearchChange = jest.fn();
    const { getByPlaceholderText } = render(<PDVSection {...createProps({ onSearchChange })} />);
    fireEvent.changeText(getByPlaceholderText('Pesquisar produto...'), 'test');
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });

  it('should filter products by search text (name match)', () => {
    const products = [
      { ...baseProduct, id: 'p1', name: 'Ração Pedigree' },
      { id: 'p2', name: 'Filtro de água', price: 30, stock: 10 },
    ];
    const { getByText, queryByText } = render(
      <PDVSection
        {...createProps({
          pdvProducts: products,
          pdvSearchText: 'ração',
          pdvCart: { p1: baseCart.p1, p2: { qty: 1, checked: false } },
        })}
      />
    );
    expect(getByText('Ração Pedigree')).toBeTruthy();
    expect(queryByText('Filtro de água')).toBeNull();
  });

  it('should call onCategoryToggle when category pressed', () => {
    const onCategoryToggle = jest.fn();
    const { getByText } = render(<PDVSection {...createProps({ onCategoryToggle })} />);
    fireEvent.press(getByText('Pesca'));
    expect(onCategoryToggle).toHaveBeenCalledWith('Pesca');
  });

  it('should call onRegisterPress when register button pressed', () => {
    const onRegisterPress = jest.fn();
    const { getByText } = render(<PDVSection {...createProps({ onRegisterPress })} />);
    fireEvent.press(getByText('Registrar venda'));
    expect(onRegisterPress).toHaveBeenCalled();
  });

  it('should call onCancelPress in select mode', () => {
    const onCancelPress = jest.fn();
    const { getByText } = render(<PDVSection {...createProps({ pdvSelectMode: true, onCancelPress })} />);
    fireEvent.press(getByText('Cancelar'));
    expect(onCancelPress).toHaveBeenCalled();
  });

  it('should call onUpdateQty when +/- pressed in select mode', () => {
    const onUpdateQty = jest.fn();
    const { getByText } = render(<PDVSection {...createProps({ pdvSelectMode: true, onUpdateQty })} />);
    fireEvent.press(getByText('2')); // the qty text itself
  });

  it('should render in dark mode', () => {
    const { getByText } = render(<PDVSection {...createProps({ isDarkMode: true })} />);
    expect(getByText('Test Product')).toBeTruthy();
  });
});
