jest.mock('../../data/datasources/supabase/client', () => ({}));

import { getFirstImageUrl } from '../../presentation/screens/admin/ManageProducts/useManageProductsScreen';

describe('useManageProductsScreen - getFirstImageUrl', () => {
  it('returns null for null/undefined/empty (line 22 true branch)', () => {
    expect(getFirstImageUrl(null)).toBeNull();
    expect(getFirstImageUrl(undefined)).toBeNull();
    expect(getFirstImageUrl('')).toBeNull();
  });

  it('returns URL as-is for non-JSON strings (line 24 false branch)', () => {
    expect(getFirstImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('returns first element for JSON array (line 25 try)', () => {
    const result = getFirstImageUrl('["https://example.com/1.jpg", "https://example.com/2.jpg"]');
    expect(result).toBe('https://example.com/1.jpg');
  });

  it('returns original string for invalid JSON (line 25 catch)', () => {
    const result = getFirstImageUrl('[invalid json]');
    expect(result).toBe('[invalid json]');
  });

  it('returns url as-is for empty JSON array', () => {
    const result = getFirstImageUrl('[]');
    expect(result).toBe('[]');
  });
});
