import { OrderItem } from './OrderItem';
import { Coordinates } from '../value-objects/Coordinates';

export class Order {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly items: OrderItem[],
    public readonly totalAmount: number,
    public readonly shippingFee: number,
    public readonly status: 'confirmed' | 'completed' | 'cancelled',
    public readonly deliveryAddress: string,
    public readonly coordinates?: Coordinates
  ) {
    if (totalAmount < 0 || shippingFee < 0) {
      throw new Error('Amounts cannot be negative');
    }
  }

  calculateTotalWithShipping(): number {
    return Number((this.totalAmount + this.shippingFee).toFixed(2));
  }

  calculateReactiveShipping(distanceKm: number, baseFeePerKm: number, date: Date): number {
    let fee = distanceKm * baseFeePerKm;
    // Apply 1.5x surge pricing on Sundays (getDay() === 0)
    if (date.getDay() === 0) {
      fee *= 1.5;
    }
    return Number(fee.toFixed(2));
  }

  complete(): Order {
    return new Order(
      this.id,
      this.clientId,
      this.items,
      this.totalAmount,
      this.shippingFee,
      'completed',
      this.deliveryAddress,
      this.coordinates
    );
  }

  cancel(): Order {
    return new Order(
      this.id,
      this.clientId,
      this.items,
      this.totalAmount,
      this.shippingFee,
      'cancelled',
      this.deliveryAddress,
      this.coordinates
    );
  }
}
