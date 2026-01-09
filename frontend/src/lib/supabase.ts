/**
 * Supabase Client Setup
 * 
 * Direct connection to Supabase for Global Catalog access
 * Uses environment variables for configuration
 * 
 * IMPORTANT: Set these in your .env.local or Vercel environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Global catalog features will be disabled.\n' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

/**
 * Supabase client instance
 * 
 * Uses anon key for client-side access (RLS policies will enforce security)
 * 
 * NOTE: The upsert_global_catalog RPC function uses auth.uid() to get UUID automatically.
 * If your app uses custom JWT (not Supabase Auth), you may need to set a session token.
 * The function has SECURITY DEFINER, so it should work even without active Supabase Auth session,
 * but created_by_user_id might be null in that case.
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We're using custom JWT auth, not Supabase Auth
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Global Catalog Product Type (matches Supabase schema)
 */
export interface GlobalCatalogProduct {
  barcode: string;
  name: string;
  category?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: string; // UUID
  contribution_count?: number;
  last_contributed_at?: string;
}

/**
 * Search global catalog by barcode
 * 
 * Uses Supabase client directly (RLS policies apply)
 * Returns GlobalCatalogProduct if found, null otherwise
 * 
 * This is called when a product is not found in local store catalog
 */
export async function searchGlobalCatalogByBarcode(
  barcode: string
): Promise<GlobalCatalogProduct | null> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping global catalog search.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('global_catalog')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) {
      // If not found (PGRST116), return null (not an error - product doesn't exist globally)
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return null;
      }
      console.warn('Global catalog lookup error:', error);
      return null;
    }

    return data as GlobalCatalogProduct;
  } catch (error) {
    console.warn('Global catalog lookup failed:', error);
    return null; // Graceful degradation: continue without global catalog
  }
}

/**
 * Contribute product to global catalog (Crowdsourcing)
 * 
 * Uses the upsert_global_catalog RPC function (defined in Supabase SQL)
 * 
 * IMPORTANT: UUID (created_by_user_id) is handled automatically by the RPC function
 * The function uses auth.uid() to get the current user's UUID from Supabase Auth
 * 
 * This is called automatically when a user saves a NEW product
 */
export async function contributeToGlobalCatalogRPC(
  barcode: string,
  name: string,
  category?: string,
  image_url?: string,
  description?: string,
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping global catalog contribution.');
    return false;
  }

  try {
    // Call the RPC function defined in Supabase SQL
    // Function signature: upsert_global_catalog(p_barcode, p_name, p_category, p_image_url, p_description)
    // 
    // IMPORTANT: The function uses auth.uid() internally to get UUID (created_by_user_id).
    // If using custom JWT auth (not Supabase Auth), auth.uid() might be null, but the function
    // will still work due to SECURITY DEFINER. The contribution will be tracked, but
    // created_by_user_id might be null if no Supabase Auth session exists.
    const { data, error } = await supabase.rpc('upsert_global_catalog', {
      p_barcode: barcode,
      p_name: name,
      p_category: category || null,
      p_image_url: image_url || null,
      p_description: description || null,
    });

    if (error) {
      console.warn('Failed to contribute to global catalog:', error);
      // Don't throw - local save succeeded, global contribution is secondary
      return false;
    }

    // Success: Product contributed to global catalog (or contribution count updated)
    // The function returns the row with updated contribution_count
    if (data) {
      console.log('✅ Product contributed to global catalog:', { 
        barcode, 
        name, 
        contribution_count: data.contribution_count || 1 
      });
    }
    return true;
  } catch (error) {
    console.warn('Global catalog contribution failed:', error);
    // Graceful degradation: local save succeeded, continue without global contribution
    return false;
  }
}
