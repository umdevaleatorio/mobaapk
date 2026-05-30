import { StoreLocation } from '../../../domain/entities/StoreLocation';
import { Coordinates } from '../../../domain/value-objects/Coordinates';

describe('StoreLocation Entity', () => {
  it('should create a valid store location', () => {
    const store = new StoreLocation('s1', 'Agropet Lambari Centro', -21.97, -45.35);
    expect(store.id).toBe('s1');
    expect(store.name).toBe('Agropet Lambari Centro');
    expect(store.coordinatesVO.latitude).toBe(-21.97);
    expect(store.coordinatesVO.longitude).toBe(-45.35);
  });

  it('should check if client coords is within radius correctly', () => {
    const store = new StoreLocation('s1', 'Centro', -21.97, -45.35);
    const clientNear = new Coordinates(-21.971, -45.351);
    const clientFar = new Coordinates(-22.50, -46.00);

    expect(store.isCoordinateWithinRadius(clientNear, 5)).toBe(true);
    expect(store.isCoordinateWithinRadius(clientFar, 5)).toBe(false);
  });
});
