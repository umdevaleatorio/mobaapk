import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Coordinates } from '../value-objects/Coordinates';

export interface ProcessPDVCheckoutRequest {
  orderId: string;
  clientId: string;
  items: OrderItem[];
  deliveryAddress: string;
  coordinates?: Coordinates;
  onInsertOrder: (order: Order) => Promise<void>;
  onDecrementStock: (productId: string, quantity: number) => Promise<void>;
}

export class ProcessPDVCheckoutUseCase {
  async execute(request: ProcessPDVCheckoutRequest): Promise<Order> {
    const {
      orderId,
      clientId,
      items,
      deliveryAddress,
      coordinates,
      onInsertOrder,
      onDecrementStock,
    } = request;

    if (items.length === 0) {
      throw new Error('Cannot process checkout with empty items');
    }

    let total = 0;
    for (const item of items) {
      total += item.getSubtotal();
    }
    total = Number(total.toFixed(2));

    const order = new Order(
      orderId,
      clientId,
      items,
      total,
      0,
      'confirmed',
      deliveryAddress,
      coordinates
    );

    for (const item of items) {
      await onDecrementStock(item.productId, item.quantity);
    }

    const completedOrder = order.complete();
    await onInsertOrder(completedOrder);

    return completedOrder;
  }
}
