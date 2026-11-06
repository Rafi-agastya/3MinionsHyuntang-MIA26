import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminClientInstance: SupabaseClient | null = null;
let publicClientInstance: SupabaseClient | null = null;

/**
 * Mendapatkan Supabase client publik (anon) untuk verifikasi token atau sesi dasar.
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (!publicClientInstance) {
    publicClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return publicClientInstance;
}

/**
 * Mendapatkan Supabase client admin (dengan service_role key).
 * Hanya boleh di server dan tidak boleh bocor ke client (AGENTS.md Aturan 8).
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    const key = supabaseServiceRoleKey || supabaseAnonKey;
    adminClientInstance = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClientInstance;
}

