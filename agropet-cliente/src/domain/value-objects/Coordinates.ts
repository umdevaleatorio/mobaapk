export class Coordinates {
  constructor(public readonly latitude: number, public readonly longitude: number) {
    if (latitude < -90 || latitude > 90) throw new Error('Latitude must be between -90 and 90');
    if (longitude < -180 || longitude > 180) throw new Error('Longitude must be between -180 and 180');
  }

  distanceTo(other: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((other.latitude - this.latitude) * Math.PI) / 180;
    const dLon = ((other.longitude - this.longitude) * Math.PI) / 180;
    const lat1 = (this.latitude * Math.PI) / 180;
    const lat2 = (other.latitude * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
}
