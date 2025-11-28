import { NextResponse } from 'next/server'

import { driveFetch, findFolderByName, requireServerAccessToken } from '@/sync/drive'
import { DRIVE_ROOT_NAME } from '@/core'

const ROOT_NAME = DRIVE_ROOT_NAME
const ROOT_PARENT_ID = 'root'

type RelinkBody = {
  projectId: string
  projectName: string
  folderInput: string
}

type RelinkErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_INPUT'
  | 'ROOT_NOT_FOUND'
  | 'NOT_FOUND'
  | 'NOT_A_FOLDER'
  | 'TRASHED'
  | 'NOT_OWNER'
  | 'WRONG_PARENT'
  | 'NAME_MISMATCH'

type RelinkErrorResponse = { error: string; code: RelinkErrorCode }

const FOLDER_FIELDS = [
  'id',
  'name',
  'parents',
  'trashed',
  'owners',
  'mimeType',
].join(',')

function extractFolderId(raw: string | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (!trimmed.includes('/')) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]{10,})/)
    if (folderMatch?.[1]) {
      return folderMatch[1]
    }
    const idParam = url.searchParams.get('id')
    if (idParam) {
      return idParam
    }
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length) {
      const lastSegment = segments[segments.length - 1]
      if (lastSegment && /^[a-zA-Z0-9_-]{10,}$/.test(lastSegment)) {
        return lastSegment
      }
    }
  } catch {
    // fall through to regex extraction below
  }

  const fallbackMatch = trimmed.match(/[a-zA-Z0-9_-]{10,}/)
  return fallbackMatch?.[0] ?? null
}

function errorResponse(code: RelinkErrorCode, message: string, status = 400) {
  return NextResponse.json({ error: message, code } satisfies RelinkErrorResponse, { status })
}

export async function POST(req: Request) {
  let token: string
  try {
    token = await requireServerAccessToken()
  } catch {
    return errorResponse('INVALID_REQUEST', 'Authentication required.', 401)
  }

  let body: RelinkBody
  try {
    body = (await req.json()) as RelinkBody
  } catch {
    return errorResponse('INVALID_REQUEST', 'Invalid JSON body.')
  }

  if (!body?.projectId || !body?.projectName || !body?.folderInput) {
    return errorResponse('INVALID_REQUEST', 'projectId, projectName, and folderInput are required.')
  }

  const folderId = extractFolderId(body.folderInput)
  if (!folderId) {
    return errorResponse('INVALID_INPUT', 'Enter a valid Google Drive folder link or ID.')
  }

  let root: { id: string } | null
  try {
    root = await findFolderByName(token, ROOT_NAME, ROOT_PARENT_ID)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Drive error.'
    return errorResponse('INVALID_REQUEST', `Could not verify ${ROOT_NAME} root folder. ${message}`)
  }
  if (!root?.id) {
    return errorResponse('ROOT_NOT_FOUND', `${ROOT_NAME} root folder not found. Re-create it before relinking.`)
  }

  let res: Response
  try {
    res = await driveFetch(token, `/files/${folderId}`, {
      query: { fields: FOLDER_FIELDS },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Drive request failed.'
    return errorResponse('INVALID_REQUEST', message)
  }

  if (res.status === 404) {
    return errorResponse('NOT_FOUND', 'That Drive folder could not be found.')
  }
  if (!res.ok) {
    const text = await res.text()
    return errorResponse('INVALID_REQUEST', `Drive lookup failed: ${res.status} ${text}`, 502)
  }

  const folder = (await res.json()) as {
    id: string
    name: string
    parents?: string[]
    trashed?: boolean
    owners?: Array<{ me?: boolean }>
    mimeType?: string
  }

  if (folder.mimeType !== 'application/vnd.google-apps.folder') {
    return errorResponse('NOT_A_FOLDER', 'Provide a Google Drive folder link or ID.')
  }

  if (folder.trashed) {
    return errorResponse('TRASHED', 'That folder is in the trash. Restore it in Drive, then try again.')
  }

  const ownsFolder = (folder.owners || []).some((owner) => owner.me)
  if (!ownsFolder) {
    return errorResponse('NOT_OWNER', 'You can only relink folders you own.')
  }

  const parents = folder.parents || []
  if (!parents.includes(root.id)) {
    return errorResponse('WRONG_PARENT', `Move the folder under /My Drive/${ROOT_NAME}/ before relinking.`)
  }

  const expectedName = `${body.projectName}__${body.projectId}`
  if (folder.name !== expectedName) {
    return errorResponse(
      'NAME_MISMATCH',
      `Folder name must be "${expectedName}". Rename it in Drive and try again.`,
    )
  }

  return NextResponse.json({ folderId: folder.id })
}

