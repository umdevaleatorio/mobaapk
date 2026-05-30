import { DbService, supabase } from '../../../db/dbService';

describe('DbService', () => {
  it('should return the supabase client singleton', () => {
    const client = DbService.getClient();
    expect(client).toBe(supabase);
  });
});
