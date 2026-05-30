import * as ValueObjects from '../../../domain/value-objects';

describe('domain/value-objects/index (barrel)', () => {
  it('should re-export all value objects', () => {
    expect(ValueObjects.Email).toBeDefined();
    expect(ValueObjects.Coordinates).toBeDefined();
    expect(ValueObjects.Price).toBeDefined();
    expect(ValueObjects.Stock).toBeDefined();
    expect(ValueObjects.Phone).toBeDefined();
    expect(ValueObjects.Username).toBeDefined();
  });
});
