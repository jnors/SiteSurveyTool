import { NextResponse } from 'next/server'

import {
  ensureChildFolder,
  extensionFromMime,
  findFileInFolder,
  parseDataUrl,
  requireServerAccessToken,
  uploadFileMultipart,
} from '@/lib/google-server'

type UploadPhotoBody = {
  projectFolderId: string
  photoId: string
  pinId: string
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

  let body: UploadPhotoBody
  try {
    body = (await req.json()) as UploadPhotoBody
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!body?.projectFolderId || !body.photoId || !body.dataUrl) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
  }

  try {
    const { buffer, mimeType } = parseDataUrl(body.dataUrl)
    const photosFolderId = await ensureChildFolder(token, body.projectFolderId, 'photos')
    const extension = extensionFromMime(mimeType)
    const name = body.fileName || `${body.photoId}.${extension}`
    const existing = await findFileInFolder(token, photosFolderId, name)
    const uploaded = await uploadFileMultipart(token, {
      name,
      parentId: photosFolderId,
      mimeType,
      data: buffer,
      fileId: existing?.id,
    })

    return NextResponse.json({ driveFileId: uploaded.id })
  } catch (error: any) {
    console.error('[drive] photo upload failed', error)
    const message = error instanceof Error ? error.message : 'UPLOAD_FAILED'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
