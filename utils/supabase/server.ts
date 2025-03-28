import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  // Type assertion to help TypeScript understand what we're working with
  const cookieHandler = cookieStore as unknown as {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: any): void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieHandler.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieHandler.set(name, value, options);
          } catch (error) {
            // This can happen when cookies are manipulated by server actions or middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieHandler.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // This can happen when cookies are manipulated by server actions or middleware
          }
        },
      },
    },
  );
};
