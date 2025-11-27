import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const selfScope = globalThis.self as Record<string, any>
const OriginalRequest = globalThis.Request

describe('service worker cacheRequestWithDeps', () => {
  beforeEach(() => {
    vi.resetModules()
    selfScope.__FieldPins_SW_TEST__ = {}
    selfScope.addEventListener = selfScope.addEventListener || vi.fn()
    selfScope.location = {
      origin: 'https://FieldPins.test',
      href: 'https://FieldPins.test/',
    }
    const RequestShim = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string' && input.startsWith('/')) {
        return new OriginalRequest(`https://FieldPins.test${input}`, init)
      }
      return new OriginalRequest(input, init)
    }
    RequestShim.prototype = OriginalRequest.prototype
    selfScope.Request = RequestShim as unknown as typeof Request
    globalThis.Request = RequestShim as unknown as typeof Request
  })

  afterEach(() => {
    globalThis.Request = OriginalRequest
    selfScope.Request = OriginalRequest
    delete selfScope.caches
    delete selfScope.fetch
  })

  it('stores navigation HTML and dependent _next assets', async () => {
    const put = vi.fn()
    const match = vi.fn()
    const cache = { put, match }

    const cachesOpen = vi.fn().mockResolvedValue(cache)
    selfScope.caches = { open: cachesOpen }

    const htmlBody = `
      <html>
        <head>
          <script src="/_next/static/chunk.js"></script>
          <link href="/styles/app.css" rel="stylesheet" />
        </head>
      </html>
    `
    const htmlResponse = new Response(htmlBody, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })
    const assetResponse = new Response('console.log("chunk")', {
      status: 200,
      headers: { 'content-type': 'application/javascript' },
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse)
      .mockResolvedValueOnce(assetResponse)
    selfScope.fetch = fetchMock

    await import('../public/sw.js')

    const { cacheRequestWithDeps } = selfScope.__FieldPins_SW_TEST__
    const requestUrl = 'https://FieldPins.test/projects/abc'
    const request = new Request(requestUrl, { credentials: 'include' })
    await cacheRequestWithDeps(cache, request)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe(request)
    const assetRequest = fetchMock.mock.calls[1][0]
    expect(assetRequest).toBeInstanceOf(Request)
    expect(assetRequest.url.endsWith('/_next/static/chunk.js')).toBe(true)

    const storedKeys = put.mock.calls.map(([arg]) => (arg instanceof Request ? arg.url : arg))
    expect(storedKeys).toEqual(
      expect.arrayContaining([
        'https://fieldpins.test/projects/abc',
        '/projects/abc',
        'https://fieldpins.test/_next/static/chunk.js',
        '/_next/static/chunk.js',
      ])
    )

    expect(storedKeys).not.toContain('/styles/app.css')
  })
})
