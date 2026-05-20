import { Product } from '../../src/domain/entities/Product';

export class ProductFactory {
  static create(overrides?: Partial<{
    id: string;
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    active: boolean;
    imageUrl: string;
    description: string;
  }>): Product {
    return new Product(
      overrides?.id ?? 'prod-1',
      overrides?.name ?? 'Ração Premium 15KG',
      overrides?.price ?? 150.0,
      overrides?.stock ?? 20,
      overrides?.categoryId ?? 'cat-1',
      overrides?.active ?? true,
      overrides?.imageUrl ?? 'https://example.com/racao.png',
      overrides?.description ?? 'Ração premium para cães adultos'
    );
  }
}
