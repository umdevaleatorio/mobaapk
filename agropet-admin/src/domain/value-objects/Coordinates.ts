export class Coordinates {
  constructor(public readonly latitude: number, public readonly longitude: number) {
    if (latitude < -90 || latitude > 90) throw new Error('Latitude must be between -90 and 90');
    if (longitude < -180 || longitude > 180) throw new Error('Longitude must be between -180 and 180');
  }
}
