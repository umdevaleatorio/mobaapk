import { SecureStoreService } from '../../services/secureStoreService';

export interface LedgerItem {
  id: string;
  description: string;
  amount: number;
  type: 'venda' | 'sangria' | 'suprimento' | string;
  date: string;
}

export class SynchronizeCashFlowUseCase {
  async execute(secureStoreKey: string): Promise<LedgerItem[]> {
    const rawData = await SecureStoreService.getItem(secureStoreKey);
    if (!rawData) {
      return [];
    }

    try {
      const items: LedgerItem[] = JSON.parse(rawData);
      if (!Array.isArray(items)) {
        return [];
      }

      // Purge any manual/accidental 'venda' entries to avoid duplicates with online DB orders
      const synchronized = items.filter(item => item.type !== 'venda');

      await SecureStoreService.setItem(secureStoreKey, JSON.stringify(synchronized));
      return synchronized;
    } catch (e) {
      console.error('[SynchronizeCashFlowUseCase] Sync failed, clearing corrupted data:', e);
      await SecureStoreService.deleteItem(secureStoreKey);
      return [];
    }
  }
}
