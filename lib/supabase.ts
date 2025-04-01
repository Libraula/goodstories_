import { createBrowserClient } from "@supabase/ssr"

// These values should ideally come from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for use in the browser
// The createBrowserClient function from @supabase/ssr automatically handles cookies
export const createClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    // No custom cookie handling needed here for browser client
  )
}

// Helper function to check if a user is authenticated on the client side
export async function isUserLoggedIn() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !!session
}

// Helper function to get the current user ID
export async function getCurrentUserId() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id
}

// Helper function to handle login modal display
export async function handleAuthAction(callback: () => Promise<any>, showLoginModal: () => void) {
  const isLoggedIn = await isUserLoggedIn()

  if (isLoggedIn) {
    return callback()
  } else {
    showLoginModal()
    return null
  }
}

