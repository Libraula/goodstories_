// This file contains configuration for build-time vs runtime behavior

// Check if we're in a static build context
export const isStaticBuild = process.env.NEXT_PHASE === "phase-production-build"

// Use this to conditionally skip Supabase initialization during static builds
export const shouldSkipSupabase = isStaticBuild
