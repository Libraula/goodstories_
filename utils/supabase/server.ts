import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      async get(name: string) {
        // Standard implementation: just return the cookie value
        return cookieStore.get(name)?.value
      },
      async set(name: string, value: string, options: any) {
        try {
          // Ensure cookies are properly set with secure attributes
          // Remove the hardcoded domain attribute
          await cookieStore.set({
            name,
            value,
            ...options,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            // domain: 'localhost', // REMOVED: Let browser handle domain based on request hostname
            // maxAge is typically handled by Supabase options passed in `options`
          })
        } catch (error) {
          // This can happen when cookies are manipulated by server actions or middleware
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
          // This can happen when cookies are manipulated by server actions or middleware
          console.error("Error removing cookie in server client:", error)
        }
      },
    },
  })
}

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const supabase = await createClient()
  // Use getUser() to verify the session server-side
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    // Log the error but potentially still return unauthenticated status
    console.error("Error fetching user with getUser():", error)
    return { isAuthenticated: false, userId: null, supabase }
  }

  // Return authentication status based on verified user object
  return { isAuthenticated: !!user, userId: user?.id, supabase }
}
