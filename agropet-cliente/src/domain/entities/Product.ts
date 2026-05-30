import { Price } from '../value-objects/Price';
import { Stock } from '../value-objects/Stock';

export class Product {
  public readonly priceVO: Price;
  public readonly stockVO: Stock;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly categoryId: string,
    public readonly active: boolean,
    public readonly imageUrl?: string,
    public readonly description?: string
  ) {
    this.priceVO = new Price(price);
    this.stockVO = new Stock(stock);
  }

  hasLowStock(warningMargin: number): boolean {
    return this.stockVO.isCritical(warningMargin);
  }

  isOutOfStock(): boolean {
    return this.stockVO.isOutOfStock();
  }

  deactivate(): Product {
    return new Product(
      this.id,
      this.name,
      this.price,
      this.stock,
      this.categoryId,
      false,
      this.imageUrl,
      this.description
    );
  }

  validatePhotos(): boolean {
    if (!this.imageUrl) return true;
    try {
      if (this.imageUrl.startsWith('[') && this.imageUrl.endsWith(']')) {
        const parsed = JSON.parse(this.imageUrl);
        if (Array.isArray(parsed)) {
          return parsed.length <= 5;
        }
      }
      return true; // Single image url
    } catch {
      return true; // Not a valid JSON, treat as a single string
    }
  }
}
