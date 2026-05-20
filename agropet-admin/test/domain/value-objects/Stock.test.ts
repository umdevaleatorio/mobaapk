import { Stock } from '../../../src/domain/value-objects/Stock';

describe('Stock Value Object', () => {
  // ── Casos válidos ──
  it('should create a valid stock with positive quantity', () => {
    const stock = new Stock(50);
    expect(stock.quantity).toBe(50);
  });

  it('should accept zero stock (out of stock)', () => {
    const stock = new Stock(0);
    expect(stock.quantity).toBe(0);
  });

  it('should accept large stock quantities', () => {
    const stock = new Stock(10000);
    expect(stock.quantity).toBe(10000);
  });

  // ── Casos inválidos ──
  it('should throw for negative stock', () => {
    expect(() => new Stock(-1)).toThrow('Stock cannot be negative');
  });

  it('should throw for very negative stock', () => {
    expect(() => new Stock(-500)).toThrow('Stock cannot be negative');
  });
});
