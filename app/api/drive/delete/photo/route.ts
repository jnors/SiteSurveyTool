import { NextResponse } from 'next/server'

import { deleteDriveFile, requireServerAccessToken } from '@/lib/google-server'

type DeletePhotoBody = {
  driveFileId: string
}

export async function POST(req: Request) {
  let token: string
  try {
    token = await requireServerAccessToken()
  } catch {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: DeletePhotoBody
  try {
    body = (await req.json()) as DeletePhotoBody
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!body?.driveFileId) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
  }

  try {
    const deleted = await deleteDriveFile(token, body.driveFileId)
    return NextResponse.json({ deleted })
  } catch (error: any) {
    console.error('[drive] photo delete failed', error)
    const message = error instanceof Error ? error.message : 'DELETE_FAILED'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
