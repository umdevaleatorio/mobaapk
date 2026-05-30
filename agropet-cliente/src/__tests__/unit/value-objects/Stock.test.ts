import { Stock } from '../../../domain/value-objects/Stock';

describe('Stock Value Object', () => {
  it('should create a valid stock with positive quantity', () => {
    const stock = new Stock(50);
    expect(stock.quantity).toBe(50);
  });

  it('should accept zero stock', () => {
    const stock = new Stock(0);
    expect(stock.quantity).toBe(0);
  });

  it('should throw for negative stock', () => {
    expect(() => new Stock(-1)).toThrow('Stock cannot be negative');
  });

  it('should check if critical correctly', () => {
    const stock = new Stock(5);
    expect(stock.isCritical(10)).toBe(true);
    expect(stock.isCritical(2)).toBe(false);
  });

  it('should check if out of stock correctly', () => {
    const stockZero = new Stock(0);
    const stockPositive = new Stock(10);
    expect(stockZero.isOutOfStock()).toBe(true);
    expect(stockPositive.isOutOfStock()).toBe(false);
  });

  it('should increment stock correctly', () => {
    const stock = new Stock(10);
    const incremented = stock.increment(5);
    expect(incremented.quantity).toBe(15);
  });

  it('should throw when incrementing negative amount', () => {
    const stock = new Stock(10);
    expect(() => stock.increment(-5)).toThrow('Increment amount cannot be negative');
  });

  it('should decrement stock correctly', () => {
    const stock = new Stock(10);
    const decremented = stock.decrement(5);
    expect(decremented.quantity).toBe(5);
  });

  it('should throw when decrementing negative amount', () => {
    const stock = new Stock(10);
    expect(() => stock.decrement(-5)).toThrow('Decrement amount cannot be negative');
  });

  it('should throw when decrementing more than available stock', () => {
    const stock = new Stock(5);
    expect(() => stock.decrement(10)).toThrow('Stock cannot be negative');
  });
});
