import { createBrowserClient } from "@supabase/ssr"
import { shouldSkipSupabase } from "@/lib/build-config"

export const createClient = () => {
  // Skip Supabase initialization during static build
  if (shouldSkipSupabase) {
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase URL or API key not available in client.")
    return createMockClient()
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

// Helper function to create a mock client
function createMockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          data: null,
          error: null,
        }),
        data: null,
        error: null,
      }),
    }),
  } as any
}
