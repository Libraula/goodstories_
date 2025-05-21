import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { shouldSkipSupabase } from "@/lib/build-config"

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()

    // Skip Supabase initialization during static build
    if (shouldSkipSupabase) {
      return res
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase URL or API key not available in middleware.")
      return res
    }

    // Create a Supabase client using the ssr package
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          })
        },
      },
    })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Middleware: Error getting session:", sessionError)
    } else if (session) {
      console.log("Middleware: Session found and potentially refreshed:", session.user.id)
    } else {
      console.log("Middleware: No active session found.")
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

// Only run middleware on API routes and auth-required pages
export const config = {
  matcher: ["/api/:path*", "/profile/:path*", "/dashboard/:path*", "/create/:path*", "/edit/:path*", "/bookmarks"],
}
