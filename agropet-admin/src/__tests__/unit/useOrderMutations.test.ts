import { useOrderMutations } from '../../presentation/screens/admin/AdminConsultSales/hooks/useOrderMutations';
import { Alert } from 'react-native';

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('useOrderMutations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCancelOrder', () => {
    it('should show alert and return early when order is already cancelled', () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const setLoading = jest.fn();
      const fetchSales = jest.fn();
      const fetchCaixaData = jest.fn();
      const setSelectedOrder = jest.fn();
      const setShowPaymentEditModal = jest.fn();

      const { handleCancelOrder } = useOrderMutations(
        setLoading, fetchSales, fetchCaixaData,
        null, setSelectedOrder, setShowPaymentEditModal
      );

      handleCancelOrder({ id: 'order-123', status: 'cancelled' });

      expect(alertSpy).toHaveBeenCalledWith('Aviso', 'Este pedido já foi cancelado.');
      expect(setLoading).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });
});
