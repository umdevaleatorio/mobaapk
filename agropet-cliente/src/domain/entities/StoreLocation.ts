import { Coordinates } from '../value-objects/Coordinates';

export class StoreLocation {
  public readonly coordinatesVO: Coordinates;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly latitude: number,
    public readonly longitude: number
  ) {
    this.coordinatesVO = new Coordinates(latitude, longitude);
  }

  isCoordinateWithinRadius(clientCoords: Coordinates, radiusKm: number): boolean {
    const distance = this.coordinatesVO.distanceTo(clientCoords);
    return distance <= radiusKm;
  }
}
