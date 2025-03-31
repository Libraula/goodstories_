import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    
    // Refresh session if it exists.
    // createMiddlewareClient automatically refreshes the session cookie
    // when `getSession` is called.
    const {
      data: { session },
      error: sessionError, // Capture potential errors from getSession
    } = await supabase.auth.getSession();

    // Log the result of getSession
    if (sessionError) {
      console.error('Middleware: Error getting session:', sessionError);
    } else if (session) {
      console.log('Middleware: Session found and potentially refreshed:', session.user.id);
    } else {
      console.log('Middleware: No active session found.');
    }

    // The response object (`res`) has been potentially modified by `getSession`
    // to include the updated session cookie if necessary.
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
