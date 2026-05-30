import { OrderItem } from '../../../domain/entities/OrderItem';

describe('OrderItem Entity', () => {
  it('should create a valid order item', () => {
    const item = new OrderItem('p1', 'Ração Premium', 2, 100);
    expect(item.productId).toBe('p1');
    expect(item.name).toBe('Ração Premium');
    expect(item.quantity).toBe(2);
    expect(item.unitPrice).toBe(100);
    expect(item.getSubtotal()).toBe(200);
  });

  it('should throw when quantity is zero or negative', () => {
    expect(() => new OrderItem('p1', 'Ração Premium', 0, 100)).toThrow('Quantity must be greater than zero');
    expect(() => new OrderItem('p1', 'Ração Premium', -1, 100)).toThrow('Quantity must be greater than zero');
  });

  it('should throw when price is negative', () => {
    expect(() => new OrderItem('p1', 'Ração Premium', 2, -10)).toThrow('Price cannot be negative');
  });
});
