import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Refresh session if it exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If there's a session, refresh it to keep the user logged in
    if (session) {
      await supabase.auth.refreshSession();
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // Return the original response even if there's an error to avoid blocking the request
    return NextResponse.next();
  }
}

// Only run middleware on API routes and auth-required pages
export const config = {
  matcher: [
    '/api/:path*',
    '/profile/:path*',
    '/dashboard/:path*',
    '/create/:path*',
    '/edit/:path*',
    '/bookmarks',
  ],
};
