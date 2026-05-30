import { DeactivateLowStockProductsUseCase } from '../../../domain/use-cases/DeactivateLowStockProductsUseCase';
import { Product } from '../../../domain/entities/Product';

describe('DeactivateLowStockProductsUseCase', () => {
  const useCase = new DeactivateLowStockProductsUseCase();

  it('should deactivate products with stock under the warning margin', async () => {
    const prod1 = new Product('p1', 'Ração A', 100, 2, 'cat', true);
    const prod2 = new Product('p2', 'Ração B', 50, 15, 'cat', true);
    const prod3 = new Product('p3', 'Ração C', 20, 0, 'cat', true);

    const mockedDeactivate = jest.fn().mockResolvedValue(undefined);

    const deactivatedList = await useCase.execute({
      products: [prod1, prod2, prod3],
      warningMargin: 5,
      onDeactivate: mockedDeactivate,
    });

    expect(mockedDeactivate).toHaveBeenCalledTimes(2);
    expect(mockedDeactivate).toHaveBeenNthCalledWith(1, 'p1');
    expect(mockedDeactivate).toHaveBeenNthCalledWith(2, 'p3');
    
    expect(deactivatedList.length).toBe(2);
    expect(deactivatedList[0].id).toBe('p1');
    expect(deactivatedList[0].active).toBe(false);
  });
});
