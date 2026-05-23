import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Bersihkan URL dari /rest/v1/ jika user salah copy paste
let cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

// Hanya buat client jika URL valid (berawalan http dan tidak ada karakter placeholder <>)
const isValidUrl = cleanUrl.startsWith('http') && !cleanUrl.includes('<');

export const supabase = isValidUrl 
  ? createClient(cleanUrl, supabaseKey) 
  : ({} as any);
