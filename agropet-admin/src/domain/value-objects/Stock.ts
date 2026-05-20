export class Stock {
  constructor(public readonly quantity: number) {
    if (quantity < 0) throw new Error('Stock cannot be negative');
  }
}
