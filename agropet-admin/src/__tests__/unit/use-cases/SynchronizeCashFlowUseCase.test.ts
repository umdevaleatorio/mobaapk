import { SynchronizeCashFlowUseCase } from '../../../domain/use-cases/SynchronizeCashFlowUseCase';
import { SecureStoreService } from '../../../services/secureStoreService';

jest.mock('../../../services/secureStoreService');

describe('SynchronizeCashFlowUseCase', () => {
  const useCase = new SynchronizeCashFlowUseCase();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty list if secure store yields no data', async () => {
    (SecureStoreService.getItem as jest.Mock).mockResolvedValue(null);
    const result = await useCase.execute('sangrias');
    expect(result).toEqual([]);
  });

  it('should synchronize ledger entries by filtering out type venda', async () => {
    const dummyLedger = [
      { id: '1', description: 'Sangria Luz', amount: 150, type: 'sangria', date: '2026-05-26' },
      { id: '2', description: 'Venda Ração', amount: 100, type: 'venda', date: '2026-05-26' },
      { id: '3', description: 'Suprimento Troco', amount: 50, type: 'suprimento', date: '2026-05-26' }
    ];

    (SecureStoreService.getItem as jest.Mock).mockResolvedValue(JSON.stringify(dummyLedger));
    (SecureStoreService.setItem as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute('sangrias');

    expect(result.length).toBe(2);
    expect(result[0].type).toBe('sangria');
    expect(result[1].type).toBe('suprimento');

    expect(SecureStoreService.setItem).toHaveBeenCalledWith(
      'sangrias',
      JSON.stringify([
        { id: '1', description: 'Sangria Luz', amount: 150, type: 'sangria', date: '2026-05-26' },
        { id: '3', description: 'Suprimento Troco', amount: 50, type: 'suprimento', date: '2026-05-26' }
      ])
    );
  });

  it('should return empty list if secure store data is not an array', async () => {
    (SecureStoreService.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ notAnArray: true }));
    const result = await useCase.execute('sangrias');
    expect(result).toEqual([]);
  });

  it('should clear corrupted data and return empty list on JSON parse error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (SecureStoreService.getItem as jest.Mock).mockResolvedValue('invalid-json-string');
    (SecureStoreService.deleteItem as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute('sangrias');

    expect(result).toEqual([]);
    expect(SecureStoreService.deleteItem).toHaveBeenCalledWith('sangrias');
    consoleErrorSpy.mockRestore();
  });
});
