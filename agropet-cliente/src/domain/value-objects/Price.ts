export class Price {
  constructor(public readonly value: number) {
    if (value < 0) throw new Error('Price cannot be negative');
  }

  toBRL(): string {
    return `R$ ${this.value.toFixed(2).replace('.', ',')}`;
  }

  applyDiscount(percentage: number): Price {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    const discountedValue = this.value * (1 - percentage / 100);
    return new Price(Number(discountedValue.toFixed(2)));
  }

  add(other: Price): Price {
    return new Price(Number((this.value + other.value).toFixed(2)));
  }

  subtract(other: Price): Price {
    const subtracted = Math.max(0, this.value - other.value);
    return new Price(Number(subtracted.toFixed(2)));
  }
}
