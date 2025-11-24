import { NextResponse } from 'next/server'

import {
  findFileInFolder,
  requireServerAccessToken,
  uploadFileMultipart,
} from '@/sync/drive'

type WriteProjectJsonBody = {
  projectFolderId: string
  payload: unknown
}

export async function POST(req: Request) {
  let token: string
  try {
    token = await requireServerAccessToken()
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: WriteProjectJsonBody
  try {
    body = (await req.json()) as WriteProjectJsonBody
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!body?.projectFolderId || typeof body.payload === 'undefined') {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
  }

  try {
    const data = Buffer.from(JSON.stringify(body.payload, null, 2), 'utf-8')
    const existing = await findFileInFolder(token, body.projectFolderId, 'project.json')
    const uploaded = await uploadFileMultipart(token, {
      name: 'project.json',
      parentId: body.projectFolderId,
      mimeType: 'application/json',
      data,
      fileId: existing?.id,
    })
    return NextResponse.json({ driveFileId: uploaded.id })
  } catch (error: any) {
    console.error('[drive] project.json write failed', error)
    const message = error instanceof Error ? error.message : 'UPLOAD_FAILED'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

