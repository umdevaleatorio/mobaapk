import { Order } from '../../../domain/entities/Order';
import { OrderItem } from '../../../domain/entities/OrderItem';

describe('Order Entity', () => {
  const dummyItem = new OrderItem('p1', 'Ração Premium', 2, 50);

  it('should create a valid order', () => {
    const order = new Order('o1', 'c1', [dummyItem], 100, 15, 'confirmed', 'Rua Direita 10');
    expect(order.id).toBe('o1');
    expect(order.clientId).toBe('c1');
    expect(order.items.length).toBe(1);
    expect(order.totalAmount).toBe(100);
    expect(order.shippingFee).toBe(15);
    expect(order.status).toBe('confirmed');
    expect(order.deliveryAddress).toBe('Rua Direita 10');
    expect(order.calculateTotalWithShipping()).toBe(115);
  });

  it('should throw for negative total or shipping', () => {
    expect(() => new Order('o1', 'c1', [dummyItem], -10, 15, 'confirmed', 'Address')).toThrow('Amounts cannot be negative');
    expect(() => new Order('o1', 'c1', [dummyItem], 100, -5, 'confirmed', 'Address')).toThrow('Amounts cannot be negative');
  });

  it('should calculate reactive shipping on Sundays with 1.5x surge pricing', () => {
    const order = new Order('o1', 'c1', [dummyItem], 100, 0, 'confirmed', 'Address');
    
    const wednesday = new Date('2026-05-27T12:00:00'); // Wednesday
    const sunday = new Date('2026-05-24T12:00:00'); // Sunday

    const distance = 10;
    const baseFee = 2; // R$ 2.00 per KM -> R$ 20.00 normal, R$ 30.00 sunday

    expect(order.calculateReactiveShipping(distance, baseFee, wednesday)).toBe(20);
    expect(order.calculateReactiveShipping(distance, baseFee, sunday)).toBe(30);
  });

  it('should transition status correctly', () => {
    const order = new Order('o1', 'c1', [dummyItem], 100, 10, 'confirmed', 'Address');
    
    const completed = order.complete();
    expect(completed.status).toBe('completed');
    expect(completed.totalAmount).toBe(100); // immutable check

    const cancelled = order.cancel();
    expect(cancelled.status).toBe('cancelled');
  });
});
