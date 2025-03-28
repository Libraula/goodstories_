import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbucpmjlmjxwzubcrmeb.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidWNwbWpsbWp4d3p1YmNybWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNjMwODksImV4cCI6MjA1ODYzOTA4OX0.yjsqS6oPg1anANrCkHNuxJFqNJqmZYww54Ykp9toYQQ"

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? localStorage : undefined,
    storageKey: "goodstories-auth-token",
    flowType: "pkce", // Use PKCE flow for better security
    // Set the site URL to the production URL
    site: "https://www.goodstories.app",
  },
})
