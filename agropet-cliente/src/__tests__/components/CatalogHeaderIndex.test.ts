describe('CatalogHeader barrel index', () => {
  it('should export CatalogHeader as default and named', () => {
    const mod = require('../../presentation/components/CatalogHeader');
    expect(mod.default).toBeDefined();
    expect(mod.CatalogHeader).toBeDefined();
    expect(mod.default).toBe(mod.CatalogHeader);
  });

  it('should export CatalogFilter', () => {
    const mod = require('../../presentation/components/CatalogHeader');
    expect(mod.CatalogFilter).toBeDefined();
  });
});
