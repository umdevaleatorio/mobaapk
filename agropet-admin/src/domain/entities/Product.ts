import { Price } from '../value-objects/Price';
import { Stock } from '../value-objects/Stock';

export class Product {
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
    new Price(price);
    new Stock(stock);
  }
}
