// ─── lib/supabase.ts ──────────────────────────────────────────────────────────
// Single shared Supabase client. Import `supabase` wherever DB access is needed.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);