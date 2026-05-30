import { initDB } from '../../../data/datasources/sqlite/database';
import * as SQLite from 'expo-sqlite';

describe('SQLite Database', () => {
  it('should initialize the SQLite database with expected tables', async () => {
    const db = await initDB();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('agropet_cart.db');
    expect(db.execAsync).toHaveBeenCalled();
  });
});
