import { z } from 'zod'

const serverSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
})

const clientSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_DRIVE_SCOPE: z.string().optional().default('openid email profile https://www.googleapis.com/auth/drive.file'),
    NEXT_PUBLIC_MAX_PHOTO_RES: z.coerce.number().optional().default(1080),
    NEXT_PUBLIC_MAX_PHOTOS_PER_PIN: z.coerce.number().optional().default(4),
    NEXT_PUBLIC_DEMO_SYNC: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
    NEXT_PUBLIC_SEED_MODE: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
})

const processEnv = {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GOOGLE_DRIVE_SCOPE: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SCOPE,
    NEXT_PUBLIC_MAX_PHOTO_RES: process.env.NEXT_PUBLIC_MAX_PHOTO_RES,
    NEXT_PUBLIC_MAX_PHOTOS_PER_PIN: process.env.NEXT_PUBLIC_MAX_PHOTOS_PER_PIN,
    NEXT_PUBLIC_DEMO_SYNC: process.env.NEXT_PUBLIC_DEMO_SYNC,
    NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    NEXT_PUBLIC_SEED_MODE: process.env.NEXT_PUBLIC_SEED_MODE,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

// Don't validate server variables on the client
const isServer = typeof window === 'undefined'

const mergedSchema = isServer ? serverSchema.merge(clientSchema) : clientSchema

const parsed = mergedSchema.safeParse(processEnv)

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
}

export const env = parsed.data as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>
