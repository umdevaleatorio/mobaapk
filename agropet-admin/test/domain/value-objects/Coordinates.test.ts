import { Coordinates } from '../../../src/domain/value-objects/Coordinates';

describe('Coordinates Value Object', () => {
  // ── Casos válidos ──
  it('should create valid coordinates', () => {
    const coords = new Coordinates(-23.5505, -46.6333);
    expect(coords.latitude).toBe(-23.5505);
    expect(coords.longitude).toBe(-46.6333);
  });

  it('should accept zero coordinates (equator/prime meridian)', () => {
    const coords = new Coordinates(0, 0);
    expect(coords.latitude).toBe(0);
    expect(coords.longitude).toBe(0);
  });

  // ── Limites válidos (boundary) ──
  it('should accept latitude at minimum boundary (-90)', () => {
    const coords = new Coordinates(-90, 0);
    expect(coords.latitude).toBe(-90);
  });

  it('should accept latitude at maximum boundary (90)', () => {
    const coords = new Coordinates(90, 0);
    expect(coords.latitude).toBe(90);
  });

  it('should accept longitude at minimum boundary (-180)', () => {
    const coords = new Coordinates(0, -180);
    expect(coords.longitude).toBe(-180);
  });

  it('should accept longitude at maximum boundary (180)', () => {
    const coords = new Coordinates(0, 180);
    expect(coords.longitude).toBe(180);
  });

  // ── Latitude inválida ──
  it('should throw for latitude below -90', () => {
    expect(() => new Coordinates(-91, 0)).toThrow('Latitude must be between -90 and 90');
  });

  it('should throw for latitude above 90', () => {
    expect(() => new Coordinates(91, 0)).toThrow('Latitude must be between -90 and 90');
  });

  it('should throw for extreme latitude value', () => {
    expect(() => new Coordinates(1000, 0)).toThrow('Latitude must be between -90 and 90');
  });

  // ── Longitude inválida ──
  it('should throw for longitude below -180', () => {
    expect(() => new Coordinates(0, -181)).toThrow('Longitude must be between -180 and 180');
  });

  it('should throw for longitude above 180', () => {
    expect(() => new Coordinates(0, 181)).toThrow('Longitude must be between -180 and 180');
  });

  it('should throw for extreme longitude value', () => {
    expect(() => new Coordinates(0, 999)).toThrow('Longitude must be between -180 and 180');
  });
});
