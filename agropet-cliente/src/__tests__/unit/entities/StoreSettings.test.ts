import { StoreSettings } from '../../../domain/entities/StoreSettings';

describe('StoreSettings Entity', () => {
  it('should create valid store settings', () => {
    const settings = new StoreSettings('1', true, true, 10, 5, 17, true);
    expect(settings.id).toBe('1');
    expect(settings.isOpen).toBe(true);
    expect(settings.yellowStockMargin).toBe(10);
    expect(settings.redStockMargin).toBe(5);
    expect(settings.deliveryRadiusKm).toBe(17);
    expect(settings.deliveryActive).toBe(true);
  });

  it('should throw for negative numbers', () => {
    expect(() => new StoreSettings('1', true, true, -10, 5, 17, true)).toThrow('Store settings parameters cannot be negative');
    expect(() => new StoreSettings('1', true, true, 10, 5, -17, true)).toThrow('Store settings parameters cannot be negative');
  });

  it('should throw if red stock margin is equal or greater than yellow margin', () => {
    expect(() => new StoreSettings('1', true, true, 5, 5, 17, true)).toThrow('Red stock margin must be lower than yellow stock margin');
    expect(() => new StoreSettings('1', true, true, 5, 10, 17, true)).toThrow('Red stock margin must be lower than yellow stock margin');
  });

  it('should check open status correctly based on date/hour', () => {
    const settingsOpen = new StoreSettings('1', true, true, 10, 5, 17, true);
    const settingsClosed = new StoreSettings('2', true, false, 10, 5, 17, true);

    const dateDayWorking = new Date('2026-05-26T14:00:00'); // 14:00 (Open)
    const dateNight = new Date('2026-05-26T22:00:00'); // 22:00 (Closed)

    expect(settingsOpen.isCurrentlyOpen(dateDayWorking)).toBe(true);
    expect(settingsOpen.isCurrentlyOpen(dateNight)).toBe(false);
    expect(settingsClosed.isCurrentlyOpen(dateDayWorking)).toBe(false);
  });

  it('should calculate stock levels correctly', () => {
    const settings = new StoreSettings('1', true, true, 10, 5, 17, true);
    expect(settings.calculateStockLevel(15)).toBe('ok');
    expect(settings.calculateStockLevel(8)).toBe('warning');
    expect(settings.calculateStockLevel(3)).toBe('danger');
  });
});
