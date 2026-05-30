// Set env variables BEFORE loading any modules containing database client initialization
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

const { DbService } = require('../../../db/dbService');
const { supabase } = require('../../../data/datasources/supabase/client');
import * as ValueObjects from '../../../domain/value-objects';

describe('Database Infrastructure and Value Objects Re-exports', () => {
  it('should return supabase client when calling DbService.getClient', () => {
    const client = DbService.getClient();
    expect(client).toBe(supabase);
  });

  it('should correctly re-export all domain value objects', () => {
    expect(ValueObjects.Email).toBeTruthy();
    expect(ValueObjects.Coordinates).toBeTruthy();
    expect(ValueObjects.Price).toBeTruthy();
    expect(ValueObjects.Stock).toBeTruthy();
    expect(ValueObjects.Phone).toBeTruthy();
    expect(ValueObjects.Username).toBeTruthy();
  });
});
