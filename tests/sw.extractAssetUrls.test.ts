import { describe, expect, it, beforeEach, vi } from 'vitest'

const selfScope = globalThis.self as Record<string, any>

describe('service worker extractAssetUrls', () => {
  beforeEach(async () => {
    vi.resetModules()
    selfScope.__SST_SW_TEST__ = {}
    selfScope.addEventListener = selfScope.addEventListener || vi.fn()
    await import('../public/sw.js')
  })

  it('keeps same-origin script and link assets', () => {
    const html = `
      <html>
        <head>
          <script src="/_next/static/chunk.js"></script>
          <link href="/_next/static/chunk.css" rel="stylesheet" />
          <script src="/inline.js"></script>
        </head>
        <body></body>
      </html>
    `
    const assets = selfScope.__SST_SW_TEST__.extractAssetUrls(html)
    expect(assets).toContain('/_next/static/chunk.js')
    expect(assets).toContain('/_next/static/chunk.css')
    expect(assets).toContain('/inline.js')
  })

  it('drops cross-origin and data URLs, preserves query params', () => {
    const html = `
      <html>
        <head>
          <script src="https://cdn.example.com/app.js"></script>
          <link href="data:text/css;base64,AAAA" rel="stylesheet" />
          <script src="/_next/static/app.js?v=123"></script>
          <link href="./relative.css?hash=abc" rel="stylesheet" />
        </head>
        <body></body>
      </html>
    `
    const assets = selfScope.__SST_SW_TEST__.extractAssetUrls(html)
    expect(assets).not.toContain('https://cdn.example.com/app.js')
    expect(assets).not.toContain('data:text/css;base64,AAAA')
    expect(assets).toContain('/_next/static/app.js?v=123')
    expect(assets).toContain('/relative.css?hash=abc')
  })
})
