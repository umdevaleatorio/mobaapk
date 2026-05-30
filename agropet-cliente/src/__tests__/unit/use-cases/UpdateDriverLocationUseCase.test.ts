import { UpdateDriverLocationUseCase } from '../../../domain/use-cases/UpdateDriverLocationUseCase';

describe('UpdateDriverLocationUseCase', () => {
  const useCase = new UpdateDriverLocationUseCase();

  it('should validate driver coordinates and trigger update callback', async () => {
    const onUpdateLocation = jest.fn().mockResolvedValue(undefined);

    const coords = await useCase.execute({
      driverId: 'drv-1',
      latitude: -21.97,
      longitude: -45.35,
      onUpdateLocation,
    });

    expect(coords.latitude).toBe(-21.97);
    expect(coords.longitude).toBe(-45.35);

    expect(onUpdateLocation).toHaveBeenCalledTimes(1);
    expect(onUpdateLocation).toHaveBeenCalledWith('drv-1', coords);
  });

  it('should throw error when coordinates are invalid', async () => {
    const onUpdateLocation = jest.fn();

    await expect(
      useCase.execute({
        driverId: 'drv-1',
        latitude: 100,
        longitude: -45.35,
        onUpdateLocation,
      })
    ).rejects.toThrow('Latitude must be between -90 and 90');
  });
});
