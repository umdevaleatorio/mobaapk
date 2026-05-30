export class Stock {
  constructor(public readonly quantity: number) {
    if (quantity < 0) throw new Error('Stock cannot be negative');
  }

  isCritical(warningMargin: number): boolean {
    return this.quantity <= warningMargin;
  }

  isOutOfStock(): boolean {
    return this.quantity === 0;
  }

  increment(amount: number): Stock {
    if (amount < 0) throw new Error('Increment amount cannot be negative');
    return new Stock(this.quantity + amount);
  }

  decrement(amount: number): Stock {
    if (amount < 0) throw new Error('Decrement amount cannot be negative');
    if (this.quantity - amount < 0) throw new Error('Stock cannot be negative');
    return new Stock(this.quantity - amount);
  }
}
