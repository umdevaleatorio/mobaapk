export class StoreSettings {
  constructor(
    public readonly id: string,
    public readonly showGreetingBar: boolean,
    public readonly isOpen: boolean,
    public readonly yellowStockMargin: number,
    public readonly redStockMargin: number,
    public readonly deliveryRadiusKm: number,
    public readonly deliveryActive: boolean
  ) {
    if (yellowStockMargin < 0 || redStockMargin < 0 || deliveryRadiusKm < 0) {
      throw new Error('Store settings parameters cannot be negative');
    }
    if (redStockMargin >= yellowStockMargin) {
      throw new Error('Red stock margin must be lower than yellow stock margin');
    }
  }

  isCurrentlyOpen(date: Date): boolean {
    // If global toggle says it is closed, it is closed
    if (!this.isOpen) return false;

    // Rich domain rule: default opening hours are 8:00 to 18:00
    const hours = date.getHours();
    return hours >= 8 && hours < 18;
  }

  calculateStockLevel(stockQuantity: number): 'ok' | 'warning' | 'danger' {
    if (stockQuantity <= this.redStockMargin) {
      return 'danger';
    }
    if (stockQuantity <= this.yellowStockMargin) {
      return 'warning';
    }
    return 'ok';
  }
}
