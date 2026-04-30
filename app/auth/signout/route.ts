import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    const url = new URL("/auth?setup=1", request.url);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(new URL("/auth", request.url), {
    status: 302,
  });

  // Explicitly clear all cookies FIRST
  request.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, "", { 
      maxAge: 0, 
      path: "/",
      httpOnly: true,
      sameSite: 'lax'
    });
  });

  // Then create Supabase client and sign out
  const supabase = createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { 
              ...options, 
              maxAge: 0, 
              path: "/" 
            });
          });
        },
      },
    },
  );

  await supabase.auth.signOut();

  return response;
}
