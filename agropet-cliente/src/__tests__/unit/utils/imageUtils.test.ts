import { getFirstImageUrl, getAllImageUrls } from '../../../utils/imageUtils';

describe('imageUtils', () => {
  describe('getFirstImageUrl', () => {
    it('should return null for null input', () => {
      expect(getFirstImageUrl(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getFirstImageUrl(undefined)).toBeNull();
    });

    it('should return the plain URL as-is when not a JSON array', () => {
      expect(getFirstImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    });

    it('should return the first element from a JSON array string', () => {
      const url = '["https://example.com/img1.jpg","https://example.com/img2.jpg"]';
      expect(getFirstImageUrl(url)).toBe('https://example.com/img1.jpg');
    });

    it('should return the original URL when JSON.parse fails', () => {
      const url = '[invalid json]';
      expect(getFirstImageUrl(url)).toBe('[invalid json]');
    });

    it('should return the original URL when only whitespace is around it (no trim on return)', () => {
      expect(getFirstImageUrl('  https://example.com/image.jpg  ')).toBe('  https://example.com/image.jpg  ');
    });
  });

  describe('getAllImageUrls', () => {
    it('should return empty array for null input', () => {
      expect(getAllImageUrls(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(getAllImageUrls(undefined)).toEqual([]);
    });

    it('should return array with single URL when not a JSON array', () => {
      expect(getAllImageUrls('https://example.com/image.jpg')).toEqual(['https://example.com/image.jpg']);
    });

    it('should return all URLs from a JSON array string', () => {
      const url = '["https://example.com/img1.jpg","https://example.com/img2.jpg"]';
      expect(getAllImageUrls(url)).toEqual(['https://example.com/img1.jpg', 'https://example.com/img2.jpg']);
    });

    it('should filter out null/undefined entries from the array', () => {
      const url = '["https://example.com/img1.jpg",null,"https://example.com/img2.jpg"]';
      expect(getAllImageUrls(url)).toEqual(['https://example.com/img1.jpg', 'https://example.com/img2.jpg']);
    });

    it('should return original URL wrapped in array when JSON.parse fails', () => {
      const url = '[borken]';
      expect(getAllImageUrls(url)).toEqual(['[borken]']);
    });

    it('should handle edge case of empty array string', () => {
      expect(getFirstImageUrl('[]')).toBe('[]');
    });

    it('should handle string starting with [ but not ending with ]', () => {
      expect(getFirstImageUrl('[hello')).toBe('[hello');
    });

    it('should handle string ending with ] but not starting with [', () => {
      expect(getFirstImageUrl('hello]')).toBe('hello]');
    });

    it('should fallback to url when JSON.parse returns non-array', () => {
      const originalParse = JSON.parse;
      JSON.parse = jest.fn().mockReturnValue({ not: 'array' });
      try {
        const result = getFirstImageUrl('["valid", "json"]');
        expect(result).toBe('["valid", "json"]');
      } finally {
        JSON.parse = originalParse;
      }
    });

    it('should handle string starting with [ but not ending with ]', () => {
      expect(getAllImageUrls('[hello')).toEqual(['[hello']);
    });

    it('should handle string ending with ] but not starting with [', () => {
      expect(getAllImageUrls('hello]')).toEqual(['hello]']);
    });

    it('should fallback to single-url array when JSON.parse returns non-array', () => {
      const originalParse = JSON.parse;
      JSON.parse = jest.fn().mockReturnValue({ not: 'array' });
      try {
        const result = getAllImageUrls('["valid", "json"]');
        expect(result).toEqual(['["valid", "json"]']);
      } finally {
        JSON.parse = originalParse;
      }
    });
  });
});
