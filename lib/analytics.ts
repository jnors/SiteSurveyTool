type AnalyticsPayload = Record<string, unknown> & {
  event: string
}

type DataLayerWindow = Window & {
  dataLayer?: AnalyticsPayload[]
}

export function track(payload: AnalyticsPayload) {
  if (typeof window === 'undefined') return
  const win = window as DataLayerWindow
  if (!win.dataLayer) {
    win.dataLayer = []
  }
  win.dataLayer.push(payload)
}
