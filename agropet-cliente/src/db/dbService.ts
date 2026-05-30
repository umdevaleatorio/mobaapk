import 'react-native-url-polyfill/auto';
import { supabase } from '../data/datasources/supabase/client';

export { supabase };

export class DbService {
  static getClient() {
    return supabase;
  }
}
