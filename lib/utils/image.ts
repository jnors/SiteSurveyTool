export interface CompressedImage {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  sizeBytes: number
}

export async function compressImageToJpeg(
  file: File,
  maxEdge = 1080,
  quality = 0.75,
): Promise<CompressedImage> {
  const img = await loadImageFromFile(file)
  const { canvas, outWidth, outHeight } = drawToCanvas(img, maxEdge)
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality))
  const dataUrl = await blobToDataURL(blob)
  return {
    blob,
    dataUrl,
    width: outWidth,
    height: outHeight,
    sizeBytes: blob.size,
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

function drawToCanvas(img: HTMLImageElement, maxEdge: number) {
  const { width, height } = img
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  const outWidth = Math.round(width * scale)
  const outHeight = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, outWidth, outHeight)
  return { canvas, outWidth, outHeight }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

