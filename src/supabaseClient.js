import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqbkknrspljvzkccjvno.supabase.co';
const supabaseKey = 'sb_publishable_nkmc0VjQF0tNzeKdDsL2uQ_0Vxqg7kD';
export const supabase = createClient(supabaseUrl, supabaseKey);
