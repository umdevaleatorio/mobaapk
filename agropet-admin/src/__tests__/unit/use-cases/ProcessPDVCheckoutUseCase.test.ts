import { ProcessPDVCheckoutUseCase } from '../../../domain/use-cases/ProcessPDVCheckoutUseCase';
import { OrderItem } from '../../../domain/entities/OrderItem';

describe('ProcessPDVCheckoutUseCase', () => {
  const useCase = new ProcessPDVCheckoutUseCase();

  it('should process PDV checkout atomically, modifying stocks and creating order', async () => {
    const item1 = new OrderItem('p1', 'Ração Premium', 2, 80);
    const item2 = new OrderItem('p2', 'Sementes', 10, 10);

    const onInsertOrder = jest.fn().mockResolvedValue(undefined);
    const onDecrementStock = jest.fn().mockResolvedValue(undefined);

    const order = await useCase.execute({
      orderId: 'o1',
      clientId: 'c1',
      items: [item1, item2],
      deliveryAddress: 'Balcão da loja',
      onInsertOrder,
      onDecrementStock,
    });

    expect(order.id).toBe('o1');
    expect(order.totalAmount).toBe(260); // 2*80 + 10*10 = 160 + 100 = 260
    expect(order.status).toBe('completed');

    expect(onDecrementStock).toHaveBeenCalledTimes(2);
    expect(onDecrementStock).toHaveBeenNthCalledWith(1, 'p1', 2);
    expect(onDecrementStock).toHaveBeenNthCalledWith(2, 'p2', 10);

    expect(onInsertOrder).toHaveBeenCalledTimes(1);
    expect(onInsertOrder).toHaveBeenCalledWith(order);
  });

  it('should throw error when items list is empty', async () => {
    const onInsertOrder = jest.fn();
    const onDecrementStock = jest.fn();

    await expect(
      useCase.execute({
        orderId: 'o1',
        clientId: 'c1',
        items: [],
        deliveryAddress: 'Balcão',
        onInsertOrder,
        onDecrementStock,
      })
    ).rejects.toThrow('Cannot process checkout with empty items');
  });
});
