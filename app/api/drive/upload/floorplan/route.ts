import { NextResponse } from 'next/server'

import {
  ensureChildFolder,
  extensionFromMime,
  findFileInFolder,
  parseDataUrl,
  requireServerAccessToken,
  uploadFileMultipart,
} from '@/sync/drive'

type UploadFloorplanBody = {
  projectFolderId: string
  floorplanId: string
  name: string
  dataUrl: string
  fileName?: string
}

export async function POST(req: Request) {
  let token: string
  try {
    token = await requireServerAccessToken()
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: UploadFloorplanBody
  try {
    body = (await req.json()) as UploadFloorplanBody
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!body?.projectFolderId || !body.floorplanId || !body.dataUrl) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
  }

  try {
    const { buffer, mimeType } = parseDataUrl(body.dataUrl)
    const folderId = await ensureChildFolder(token, body.projectFolderId, 'floorplans')
    const extension = extensionFromMime(mimeType)
    const name = body.fileName || `${body.floorplanId}.${extension}`
    const existing = await findFileInFolder(token, folderId, name)
    const uploaded = await uploadFileMultipart(token, {
      name,
      parentId: folderId,
      mimeType,
      data: buffer,
      fileId: existing?.id,
    })
    return NextResponse.json({ driveFileId: uploaded.id })
  } catch (error: any) {
    console.error('[drive] floorplan upload failed', error)
    const message = error instanceof Error ? error.message : 'UPLOAD_FAILED'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

