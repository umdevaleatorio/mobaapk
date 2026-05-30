import { Coordinates } from '../value-objects/Coordinates';

export interface UpdateDriverLocationRequest {
  driverId: string;
  latitude: number;
  longitude: number;
  onUpdateLocation: (driverId: string, coords: Coordinates) => Promise<void>;
}

export class UpdateDriverLocationUseCase {
  async execute(request: UpdateDriverLocationRequest): Promise<Coordinates> {
    const { driverId, latitude, longitude, onUpdateLocation } = request;

    const coords = new Coordinates(latitude, longitude);

    await onUpdateLocation(driverId, coords);
    return coords;
  }
}
