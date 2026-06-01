import { getFirstImageUrl, getAllImageUrls } from '../../../utils/imageUtils';

describe('getFirstImageUrl', () => {
  it('should return null when url is null', () => {
    expect(getFirstImageUrl(null)).toBeNull();
  });

  it('should return null when url is undefined', () => {
    expect(getFirstImageUrl(undefined)).toBeNull();
  });

  it('should return null when url is empty string', () => {
    expect(getFirstImageUrl('')).toBeNull();
  });

  it('should return the first element when url is a JSON array string', () => {
    const result = getFirstImageUrl('["https://example.com/img1.jpg", "https://example.com/img2.jpg"]');
    expect(result).toBe('https://example.com/img1.jpg');
  });

  it('should return the url itself when it is a plain url', () => {
    const result = getFirstImageUrl('https://example.com/image.jpg');
    expect(result).toBe('https://example.com/image.jpg');
  });

  it('should return the url when JSON array is empty', () => {
    const result = getFirstImageUrl('[]');
    expect(result).toBe('[]');
  });

  it('should handle invalid JSON gracefully and return the original url', () => {
    const result = getFirstImageUrl('[invalid json]');
    expect(result).toBe('[invalid json]');
  });

  it('should trim whitespace detection and return original url', () => {
    const result = getFirstImageUrl('  https://example.com/image.jpg  ');
    expect(result).toBe('  https://example.com/image.jpg  ');
  });

  it('should return whitespace-only url as-is', () => {
    const result = getFirstImageUrl('   ');
    expect(result).toBe('   ');
  });
});

describe('getAllImageUrls', () => {
  it('should return empty array when url is null', () => {
    expect(getAllImageUrls(null)).toEqual([]);
  });

  it('should return empty array when url is undefined', () => {
    expect(getAllImageUrls(undefined)).toEqual([]);
  });

  it('should return empty array when url is empty string', () => {
    expect(getAllImageUrls('')).toEqual([]);
  });

  it('should return all elements when url is a JSON array string', () => {
    const result = getAllImageUrls('["img1.jpg", "img2.jpg", "img3.jpg"]');
    expect(result).toEqual(['img1.jpg', 'img2.jpg', 'img3.jpg']);
  });

  it('should filter out empty strings from JSON array', () => {
    const result = getAllImageUrls('["img1.jpg", "", "img3.jpg"]');
    expect(result).toEqual(['img1.jpg', 'img3.jpg']);
  });

  it('should return the url wrapped in array when it is a plain url', () => {
    const result = getAllImageUrls('https://example.com/image.jpg');
    expect(result).toEqual(['https://example.com/image.jpg']);
  });

  it('should handle invalid JSON gracefully and return wrapped url', () => {
    const result = getAllImageUrls('[broken json');
    expect(result).toEqual(['[broken json']);
  });

  it('should handle empty JSON array', () => {
    const result = getAllImageUrls('[]');
    expect(result).toEqual(['[]']);
  });

  it('should trim whitespace detection and return original url in array', () => {
    const result = getAllImageUrls('  https://example.com/img.jpg  ');
    expect(result).toEqual(['  https://example.com/img.jpg  ']);
  });
});
