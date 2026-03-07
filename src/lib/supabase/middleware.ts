import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // We explicitly use createServerClient and intercept the cookies to ensure
    // SSR auth token refreshing works flawlessly on Vercel Edge functions.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser().
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // -------------------------------------------------------------------------
    // Routing Logic
    // -------------------------------------------------------------------------
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // Define protected routes that require authentication
    const isProtectedRoute =
        pathname.startsWith('/gallery') ||
        pathname.startsWith('/prompt') ||
        pathname.startsWith('/modes') ||
        pathname.startsWith('/settings');

    if (!user && isProtectedRoute) {
        // Redirect unauthorized users to login
        url.pathname = '/login';
        url.searchParams.set('next', pathname); // Keep track of where they wanted to go
        return NextResponse.redirect(url);
    }

    if (user && pathname === '/login') {
        // Redirect logged-in users away from the login page
        url.pathname = '/gallery';
        return NextResponse.redirect(url);
    }

    return supabaseResponse
}
