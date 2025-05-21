import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { shouldSkipSupabase } from "@/lib/build-config"

export const createClient = async () => {
  // Skip Supabase initialization during static build
  if (shouldSkipSupabase) {
    return createMockClient()
  }

  const cookieStore = await cookies()

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase URL or API key not available. This is expected during build for static pages.")
    return createMockClient()
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      async get(name: string) {
        return cookieStore.get(name)?.value
      },
      async set(name: string, value: string, options: any) {
        try {
          await cookieStore.set({
            name,
            value,
            ...options,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          })
        } catch (error) {
          console.error("Error setting cookie in server client:", error)
        }
      },
      async remove(name: string, options: any) {
        try {
          await cookieStore.set({
            name,
            value: "",
            ...options,
            path: "/",
            maxAge: 0,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          })
        } catch (error) {
          console.error("Error removing cookie in server client:", error)
        }
      },
    },
  })
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
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  } as any
}

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error fetching user with getUser():", error)
      return { isAuthenticated: false, userId: null, supabase }
    }

    return { isAuthenticated: !!user, userId: user?.id, supabase }
  } catch (e) {
    console.error("Error in isAuthenticated:", e)
    return { isAuthenticated: false, userId: null, supabase }
  }
}
