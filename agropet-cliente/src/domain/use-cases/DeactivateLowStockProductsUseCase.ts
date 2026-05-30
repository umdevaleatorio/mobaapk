import { Product } from '../entities/Product';

export interface DeactivateLowStockProductsRequest {
  products: Product[];
  warningMargin: number;
  onDeactivate: (productId: string) => Promise<void>;
}

export class DeactivateLowStockProductsUseCase {
  async execute(request: DeactivateLowStockProductsRequest): Promise<Product[]> {
    const { products, warningMargin, onDeactivate } = request;
    const deactivated: Product[] = [];

    for (const prod of products) {
      if (prod.active && prod.hasLowStock(warningMargin)) {
        await onDeactivate(prod.id);
        deactivated.push(prod.deactivate());
      }
    }

    return deactivated;
  }
}
