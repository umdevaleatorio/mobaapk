import { Product } from '../../../src/domain/entities/Product';

describe('Product Entity', () => {
  // ── Criação válida ──
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

  it('should create a valid product without optional fields', () => {
    const product = new Product(
      'prod-2',
      'Sementes Girassol',
      12.50,
      100,
      'cat-2',
      true
    );

    expect(product.id).toBe('prod-2');
    expect(product.name).toBe('Sementes Girassol');
    expect(product.imageUrl).toBeUndefined();
    expect(product.description).toBeUndefined();
  });

  it('should create a valid inactive product', () => {
    const product = new Product(
      'prod-3',
      'Produto Desativado',
      50.0,
      0,
      'cat-1',
      false
    );

    expect(product.active).toBe(false);
    expect(product.stock).toBe(0);
  });

  it('should accept zero price (free product)', () => {
    const product = new Product(
      'prod-4',
      'Amostra Grátis',
      0,
      5,
      'cat-1',
      true
    );

    expect(product.price).toBe(0);
  });

  // ── Validação de Price embutida ──
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

  // ── Validação de Stock embutida ──
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
});
