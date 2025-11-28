import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

const globalScope: Record<string, unknown> = globalThis as Record<string, unknown>

if (!('self' in globalScope) || typeof globalScope.self !== 'object') {
  globalScope.self = globalScope
}

const selfScope = globalScope.self as Record<string, unknown>
selfScope.__FieldPins_SW_TEST__ = {}

// Mock environment variables for Zod validation
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
Reflect.set(process.env, 'NODE_ENV', 'test')
