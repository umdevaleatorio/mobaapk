import { StoreSettings } from '../entities/StoreSettings';

export interface ManageStoreSettingsRequest {
  id: string;
  showGreetingBar: boolean;
  isOpen: boolean;
  yellowStockMargin: number;
  redStockMargin: number;
  deliveryRadiusKm: number;
  deliveryActive: boolean;
  onUpdateSettings: (settings: StoreSettings) => Promise<void>;
}

export class ManageStoreSettingsUseCase {
  async execute(request: ManageStoreSettingsRequest): Promise<StoreSettings> {
    const {
      id,
      showGreetingBar,
      isOpen,
      yellowStockMargin,
      redStockMargin,
      deliveryRadiusKm,
      deliveryActive,
      onUpdateSettings,
    } = request;

    // Utilize the rich domain entity constructor to ensure margin constraints and valid inputs
    const settings = new StoreSettings(
      id,
      showGreetingBar,
      isOpen,
      yellowStockMargin,
      redStockMargin,
      deliveryRadiusKm,
      deliveryActive
    );

    await onUpdateSettings(settings);
    return settings;
  }
}
