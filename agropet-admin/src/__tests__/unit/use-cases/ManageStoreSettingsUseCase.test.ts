import { ManageStoreSettingsUseCase } from '../../../domain/use-cases/ManageStoreSettingsUseCase';
import { StoreSettings } from '../../../domain/entities/StoreSettings';

describe('ManageStoreSettingsUseCase', () => {
  const useCase = new ManageStoreSettingsUseCase();

  it('should construct settings and trigger update callback', async () => {
    const onUpdateSettings = jest.fn().mockResolvedValue(undefined);

    const settings = await useCase.execute({
      id: 'settings-1',
      showGreetingBar: true,
      isOpen: true,
      yellowStockMargin: 12,
      redStockMargin: 4,
      deliveryRadiusKm: 18,
      deliveryActive: true,
      onUpdateSettings,
    });

    expect(settings.id).toBe('settings-1');
    expect(settings.yellowStockMargin).toBe(12);
    expect(settings.redStockMargin).toBe(4);
    expect(settings.deliveryRadiusKm).toBe(18);

    expect(onUpdateSettings).toHaveBeenCalledTimes(1);
    expect(onUpdateSettings).toHaveBeenCalledWith(settings);
  });

  it('should throw error when margins are invalid', async () => {
    const onUpdateSettings = jest.fn();

    await expect(
      useCase.execute({
        id: 'settings-1',
        showGreetingBar: true,
        isOpen: true,
        yellowStockMargin: 5,
        redStockMargin: 10, // red >= yellow is invalid
        deliveryRadiusKm: 18,
        deliveryActive: true,
        onUpdateSettings,
      })
    ).rejects.toThrow('Red stock margin must be lower than yellow stock margin');
  });
});
