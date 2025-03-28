import { createClient } from '@supabase/supabase-js'

// These values will be replaced by environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvklkxhejlqmiwatkhld.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2a2xreGhlamxxbWl3YXRraGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODUwNjUsImV4cCI6MjA1ODc2MTA2NX0.vbJNa5i_jU3I69THfCi7phCwYqLx6CBh_s910BiVjB4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
