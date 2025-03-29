import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore.get(name))?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            // Ensure cookies are properly set with secure attributes
            await cookieStore.set({
              name,
              value,
              ...options,
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 7, // 1 week
            });
          } catch (error) {
            // This can happen when cookies are manipulated by server actions or middleware
            console.error('Error setting cookie in server client:', error);
          }
        },
        async remove(name: string, options: any) {
          try {
            await cookieStore.set({
              name,
              value: '',
              ...options,
              path: '/',
              maxAge: 0,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          } catch (error) {
            // This can happen when cookies are manipulated by server actions or middleware
            console.error('Error removing cookie in server client:', error);
          }
        },
      },
    },
  );
};

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { isAuthenticated: !!session, userId: session?.user?.id, supabase };
}
