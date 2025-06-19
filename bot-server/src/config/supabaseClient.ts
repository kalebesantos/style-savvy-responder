import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY estão faltando!');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
