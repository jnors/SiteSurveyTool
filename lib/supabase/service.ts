import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export function createServiceClient() {
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
    }

    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
