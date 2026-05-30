import { Coordinates } from '../value-objects/Coordinates';
import { StoreLocation } from '../entities/StoreLocation';

export interface CalculateShippingFeeRequest {
  clientCoords: Coordinates;
  storeLocation: StoreLocation;
  baseFeePerKm: number;
  deliveryRadiusKm: number;
  date: Date;
}

export class CalculateShippingFeeUseCase {
  async execute(request: CalculateShippingFeeRequest): Promise<number> {
    const { clientCoords, storeLocation, baseFeePerKm, deliveryRadiusKm, date } = request;

    // Use rich domain validation via StoreLocation entity
    const isWithinRange = storeLocation.isCoordinateWithinRadius(clientCoords, deliveryRadiusKm);
    if (!isWithinRange) {
      throw new Error('Address is out of delivery range');
    }

    // Geodesic distance in km
    const distanceKm = storeLocation.coordinatesVO.distanceTo(clientCoords);

    // Apply reactive shipping rate calculations
    let fee = distanceKm * baseFeePerKm;
    
    // Apply 1.5x surge pricing on Sundays (getDay() === 0)
    if (date.getDay() === 0) {
      fee *= 1.5;
    }

    return Number(fee.toFixed(2));
  }
}
