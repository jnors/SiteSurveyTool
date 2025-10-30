import { expect, describe, it, beforeEach, vi } from 'vitest'

const selfScope = globalThis.self as Record<string, unknown>

describe('service worker test surface', () => {
  beforeEach(() => {
    vi.resetModules()
    selfScope.__SST_SW_TEST__ = {}
  })

  it('attaches helper functions to __SST_SW_TEST__ on import', async () => {
    // JSDOM provides addEventListener on window; ensure it exists on self for SW compatibility.
    if (typeof selfScope.addEventListener !== 'function') {
      selfScope.addEventListener = vi.fn()
    }

    await import('../public/sw.js')

    expect(selfScope.__SST_SW_TEST__).toEqual(
      expect.objectContaining({
        cacheRequestWithDeps: expect.any(Function),
        extractAssetUrls: expect.any(Function),
        matchResponse: expect.any(Function),
        storeResponse: expect.any(Function),
      })
    )
  })
})
