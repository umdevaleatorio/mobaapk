import { Product } from '../../../domain/entities/Product';

describe('Product Entity', () => {
  it('should create a valid product with all fields', () => {
    const product = new Product(
      'prod-1',
      'Ração Premium 15KG',
      150.0,
      20,
      'cat-1',
      true,
      'https://example.com/racao.png',
      'Ração premium para cães adultos'
    );

    expect(product.id).toBe('prod-1');
    expect(product.name).toBe('Ração Premium 15KG');
    expect(product.price).toBe(150.0);
    expect(product.stock).toBe(20);
    expect(product.categoryId).toBe('cat-1');
    expect(product.active).toBe(true);
    expect(product.imageUrl).toBe('https://example.com/racao.png');
    expect(product.description).toBe('Ração premium para cães adultos');
  });

  it('should throw when price is negative', () => {
    expect(() => new Product(
      'prod-5',
      'Invalid Price',
      -10,
      5,
      'cat-1',
      true
    )).toThrow('Price cannot be negative');
  });

  it('should throw when stock is negative', () => {
    expect(() => new Product(
      'prod-6',
      'Invalid Stock',
      50.0,
      -5,
      'cat-1',
      true
    )).toThrow('Stock cannot be negative');
  });

  it('should verify hasLowStock correctly', () => {
    const prod = new Product('1', 'Ração', 10, 5, 'cat', true);
    expect(prod.hasLowStock(10)).toBe(true);
    expect(prod.hasLowStock(2)).toBe(false);
  });

  it('should verify isOutOfStock correctly', () => {
    const prodZero = new Product('1', 'Ração', 10, 0, 'cat', true);
    const prodPositive = new Product('2', 'Ração', 10, 5, 'cat', true);
    expect(prodZero.isOutOfStock()).toBe(true);
    expect(prodPositive.isOutOfStock()).toBe(false);
  });

  it('should deactivate product correctly', () => {
    const prod = new Product('1', 'Ração', 10, 5, 'cat', true);
    const deactivated = prod.deactivate();
    expect(deactivated.active).toBe(false);
  });

  it('should validate base64 or photo array limits correctly', () => {
    const prodSingle = new Product('1', 'Ração', 10, 5, 'cat', true, 'http://img.png');
    expect(prodSingle.validatePhotos()).toBe(true);

    const prodArrayOk = new Product('2', 'Ração', 10, 5, 'cat', true, '["img1", "img2"]');
    expect(prodArrayOk.validatePhotos()).toBe(true);

    const prodArrayTooLong = new Product('3', 'Ração', 10, 5, 'cat', true, '["1", "2", "3", "4", "5", "6"]');
    expect(prodArrayTooLong.validatePhotos()).toBe(false);
  });

  it('should handle JSON parse errors gracefully when validating photos', () => {
    const prodInvalidJson = new Product('1', 'Ração', 10, 5, 'cat', true, '[invalid-json]');
    expect(prodInvalidJson.validatePhotos()).toBe(true);
  });

  it('should return true when validating photos if imageUrl is undefined', () => {
    const prodNoImg = new Product('1', 'Ração', 10, 5, 'cat', true, undefined);
    expect(prodNoImg.validatePhotos()).toBe(true);
  });

  it('should return true if parsed JSON is not an array', () => {
    const prodSingle = new Product('1', 'Ração', 10, 5, 'cat', true, '["img1"]');
    const originalIsArray = Array.isArray;
    Array.isArray = jest.fn().mockReturnValue(false) as any;

    expect(prodSingle.validatePhotos()).toBe(true);

    Array.isArray = originalIsArray; // restore
  });
});
