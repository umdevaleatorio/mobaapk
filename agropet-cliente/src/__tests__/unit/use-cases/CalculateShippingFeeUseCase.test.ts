import { CalculateShippingFeeUseCase } from '../../../domain/use-cases/CalculateShippingFeeUseCase';
import { Coordinates } from '../../../domain/value-objects/Coordinates';
import { StoreLocation } from '../../../domain/entities/StoreLocation';

describe('CalculateShippingFeeUseCase', () => {
  const useCase = new CalculateShippingFeeUseCase();
  const store = new StoreLocation('s1', 'Centro', -21.97, -45.35);

  it('should calculate shipping fee correctly for location in range', async () => {
    const clientCoords = new Coordinates(-21.971, -45.351); // very close
    const baseFee = 2; // R$ 2.00 / km
    const radius = 5; // 5km
    const date = new Date('2026-05-27T12:00:00'); // Wednesday

    const fee = await useCase.execute({
      clientCoords,
      storeLocation: store,
      baseFeePerKm: baseFee,
      deliveryRadiusKm: radius,
      date,
    });

    expect(fee).toBeGreaterThan(0);
  });

  it('should throw error when client is out of delivery range', async () => {
    const clientCoords = new Coordinates(-22.50, -46.00); // very far
    const baseFee = 2;
    const radius = 5;
    const date = new Date('2026-05-27T12:00:00');

    await expect(
      useCase.execute({
        clientCoords,
        storeLocation: store,
        baseFeePerKm: baseFee,
        deliveryRadiusKm: radius,
        date,
      })
    ).rejects.toThrow('Address is out of delivery range');
  });

  it('should apply Sunday surge pricing surge correctly', async () => {
    const clientCoords = new Coordinates(-21.975, -45.355);
    const baseFee = 3;
    const radius = 10;
    const wednesday = new Date('2026-05-27T12:00:00'); // Wednesday
    const sunday = new Date('2026-05-24T12:00:00'); // Sunday

    const feeWed = await useCase.execute({
      clientCoords,
      storeLocation: store,
      baseFeePerKm: baseFee,
      deliveryRadiusKm: radius,
      date: wednesday,
    });

    const feeSun = await useCase.execute({
      clientCoords,
      storeLocation: store,
      baseFeePerKm: baseFee,
      deliveryRadiusKm: radius,
      date: sunday,
    });

    expect(feeSun).toBeCloseTo(feeWed * 1.5, 2);
  });
});
