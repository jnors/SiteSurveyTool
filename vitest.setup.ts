import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

const globalScope: Record<string, unknown> = globalThis as Record<string, unknown>

if (!('self' in globalScope) || typeof globalScope.self !== 'object') {
  globalScope.self = globalScope
}

const selfScope = globalScope.self as Record<string, unknown>
selfScope.__FieldPins_SW_TEST__ = {}
