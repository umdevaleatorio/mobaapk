import { Price } from '../../../domain/value-objects/Price';

describe('Price Value Object', () => {
  it('should create a valid price with positive value', () => {
    const price = new Price(150.0);
    expect(price.value).toBe(150.0);
  });

  it('should accept zero as valid price', () => {
    const price = new Price(0);
    expect(price.value).toBe(0);
  });

  it('should throw for negative price', () => {
    expect(() => new Price(-1)).toThrow('Price cannot be negative');
  });

  it('should format to BRL correctly', () => {
    const price = new Price(29.99);
    expect(price.toBRL()).toBe('R$ 29,99');
  });

  it('should apply discount percentage correctly', () => {
    const price = new Price(100);
    const discounted = price.applyDiscount(15);
    expect(discounted.value).toBe(85);
  });

  it('should throw for invalid discount percentage', () => {
    const price = new Price(100);
    expect(() => price.applyDiscount(-5)).toThrow('Discount percentage must be between 0 and 100');
    expect(() => price.applyDiscount(105)).toThrow('Discount percentage must be between 0 and 100');
  });

  it('should add prices immutably', () => {
    const price1 = new Price(10.50);
    const price2 = new Price(5.25);
    const sum = price1.add(price2);
    expect(sum.value).toBe(15.75);
    expect(price1.value).toBe(10.50); // immutability check
  });

  it('should subtract prices immutably', () => {
    const price1 = new Price(10.50);
    const price2 = new Price(5.25);
    const diff = price1.subtract(price2);
    expect(diff.value).toBe(5.25);
  });

  it('should not allow subtracted price to be negative', () => {
    const price1 = new Price(10);
    const price2 = new Price(15);
    const diff = price1.subtract(price2);
    expect(diff.value).toBe(0);
  });
});
