import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

export const supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
