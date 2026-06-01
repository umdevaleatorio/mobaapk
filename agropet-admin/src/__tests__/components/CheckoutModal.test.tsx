import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CheckoutModal from '../../presentation/screens/admin/AdminDashboard/components/CheckoutModal';

jest.mock('../../presentation/screens/admin/AdminDashboard/AdminDashboardScreen.styles', () => ({
  styles: {
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    whiteModalContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
    whiteModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    inputHeading: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  },
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('../../utils/imageUtils', () => ({
  getFirstImageUrl: (url: string | null | undefined) => url || null,
}));

const baseProduct = {
  id: 'p1',
  name: 'Product 1',
  price: 25.50,
  image_url: 'https://example.com/img.jpg',
};

const baseCart = {
  p1: { qty: 2, checked: true },
};

const baseProps = {
  visible: true,
  pdvProducts: [baseProduct],
  pdvCart: baseCart,
  checkoutPaymentMethod: 'dinheiro' as const,
  pdvLoading: false,
  isDarkMode: false,
  onClose: jest.fn(),
  onPaymentMethodChange: jest.fn(),
  onConfirm: jest.fn(),
};

describe('CheckoutModal', () => {
  it('should render visible modal with products', () => {
    const { getByText } = render(<CheckoutModal {...baseProps} />);
    expect(getByText('Resumo da venda')).toBeTruthy();
    expect(getByText('Product 1')).toBeTruthy();
    expect(getByText('Total da Venda:')).toBeTruthy();
  });

  it('should render item without image_url (falsy branch)', () => {
    const productNoImage = { ...baseProduct, image_url: null };
    const { getByText } = render(
      <CheckoutModal {...baseProps} pdvProducts={[productNoImage]} />
    );
    expect(getByText('Product 1')).toBeTruthy();
  });

  it('should render in dark mode', () => {
    const { getByText } = render(<CheckoutModal {...baseProps} isDarkMode={true} />);
    expect(getByText('Resumo da venda')).toBeTruthy();
  });

  it('should render loading state', () => {
    const { UNSAFE_getAllByType } = render(<CheckoutModal {...baseProps} pdvLoading={true} />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it('should show dropdown when payment method pressed', () => {
    const { getByText } = render(<CheckoutModal {...baseProps} />);
    fireEvent.press(getByText('Dinheiro'));
    expect(getByText('Pix')).toBeTruthy();
  });

  it('should change payment method from dropdown', () => {
    const onPaymentMethodChange = jest.fn();
    const { getByText } = render(
      <CheckoutModal {...baseProps} onPaymentMethodChange={onPaymentMethodChange} />
    );
    fireEvent.press(getByText('Dinheiro'));
    fireEvent.press(getByText('Pix'));
    expect(onPaymentMethodChange).toHaveBeenCalledWith('pix');
  });

  it('should call onClose when cancel pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(<CheckoutModal {...baseProps} onClose={onClose} />);
    fireEvent.press(getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onConfirm when confirm pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(<CheckoutModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.press(getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
