import { createBrowserClient } from '@supabase/ssr'

// These values will be replaced by environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvklkxhejlqmiwatkhld.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2a2xreGhlamxxbWl3YXRraGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODUwNjUsImV4cCI6MjA1ODc2MTA2NX0.vbJNa5i_jU3I69THfCi7phCwYqLx6CBh_s910BiVjB4'

// Create a Supabase client for use in the browser
export const createClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name, value, options) {
          let cookie = `${name}=${value}`
          if (options?.expires) {
            cookie += `; expires=${options.expires.toUTCString()}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options?.secure) {
            cookie += '; secure'
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          }
          document.cookie = cookie
        },
        remove(name, options) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`
        },
      },
    }
  )
}

// Helper function to check if a user is authenticated on the client side
export async function isUserLoggedIn() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// Helper function to get the current user ID
export async function getCurrentUserId() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
}

// Helper function to handle login modal display
export async function handleAuthAction(callback: () => Promise<any>, showLoginModal: () => void) {
  const isLoggedIn = await isUserLoggedIn();
  
  if (isLoggedIn) {
    return callback();
  } else {
    showLoginModal();
    return null;
  }
}
