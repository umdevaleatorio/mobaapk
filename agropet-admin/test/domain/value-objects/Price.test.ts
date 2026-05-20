import { Price } from '../../../src/domain/value-objects/Price';

describe('Price Value Object', () => {
  // ── Casos válidos ──
  it('should create a valid price with positive value', () => {
    const price = new Price(150.0);
    expect(price.value).toBe(150.0);
  });

  it('should accept zero as valid price (free product)', () => {
    const price = new Price(0);
    expect(price.value).toBe(0);
  });

  it('should accept decimal prices', () => {
    const price = new Price(29.99);
    expect(price.value).toBe(29.99);
  });

  it('should accept very high prices', () => {
    const price = new Price(99999.99);
    expect(price.value).toBe(99999.99);
  });

  // ── Casos inválidos ──
  it('should throw for negative price', () => {
    expect(() => new Price(-1)).toThrow('Price cannot be negative');
  });

  it('should throw for very negative price', () => {
    expect(() => new Price(-100.50)).toThrow('Price cannot be negative');
  });
});
