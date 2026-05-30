import { Price } from '../value-objects/Price';

export class OrderItem {
  public readonly unitPriceVO: Price;

  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly unitPrice: number
  ) {
    if (quantity <= 0) throw new Error('Quantity must be greater than zero');
    this.unitPriceVO = new Price(unitPrice);
  }

  getSubtotal(): number {
    return Number((this.quantity * this.unitPrice).toFixed(2));
  }
}
