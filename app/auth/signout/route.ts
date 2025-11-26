import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const supabase = await createClient()

    // Sign out on the server to clear cookies
    await supabase.auth.signOut()

    // Redirect to the landing page
    return NextResponse.redirect(`${requestUrl.origin}/`, {
        // Use 302 Found (temporary redirect) or 303 See Other
        status: 302,
    })
}
