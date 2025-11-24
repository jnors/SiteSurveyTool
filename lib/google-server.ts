import { createClient } from "@/lib/supabase/server"

const DRIVE_BASE = "https://www.googleapis.com/drive/v3"
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"

export type GoogleAuthTokens = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

export async function getServerAuthTokens(): Promise<GoogleAuthTokens | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.provider_token) {
    return null
  }

  return {
    accessToken: session.provider_token,
    refreshToken: session.provider_refresh_token ?? undefined,
    expiresAt: session.expires_at,
  }
}

export async function requireServerAccessToken(): Promise<string> {
  const tokens = await getServerAuthTokens()
  if (!tokens?.accessToken) {
    throw new Error("Missing Google access token. Ensure the user is authenticated.")
  }

  return tokens.accessToken
}

export async function getDriveClient() {
  const accessToken = await requireServerAccessToken()
  const { google } = await import('googleapis')
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: 'v3', auth })
}

type DriveFetchInit = RequestInit & { query?: Record<string, string> }

export async function driveFetch(token: string, path: string, init: DriveFetchInit = {}) {
  const url = new URL(path.startsWith("http") ? path : `${DRIVE_BASE}${path}`)
  if (init.query) {
    for (const [key, value] of Object.entries(init.query)) {
      url.searchParams.set(key, value)
    }
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
  return res
}

export async function findFolderByName(token: string, name: string, parentId: string) {
  const res = await driveFetch(token, "/files", {
    query: {
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
      fields: "files(id, name, parents)",
      spaces: "drive",
      pageSize: "10",
    },
  })
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`)
  const data = await res.json()
  return (data.files as Array<{ id: string; name: string; parents?: string[] }>)[0] || null
}

export async function getFileById(token: string, id: string) {
  const res = await driveFetch(token, `/files/${id}`, {
    query: { fields: "id,name,parents,trashed" },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Drive get failed: ${res.status}`)
  return (await res.json()) as { id: string; name: string; parents?: string[]; trashed?: boolean }
}

export async function createFolder(token: string, name: string, parentId: string) {
  const res = await driveFetch(token, "/files", {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  })
  if (!res.ok) throw new Error(`Drive create folder failed: ${res.status}`)
  const data = await res.json()
  return data as { id: string }
}

export async function ensureChildFolder(token: string, parentId: string, name: string) {
  const existing = await findFolderByName(token, name, parentId)
  if (existing) {
    return existing.id
  }
  const created = await createFolder(token, name, parentId)
  return created.id
}

export async function findFileInFolder(token: string, parentId: string, name: string) {
  const res = await driveFetch(token, "/files", {
    query: {
      q: `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
      fields: "files(id, name, parents)",
      spaces: "drive",
      pageSize: "5",
    },
  })
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`)
  const data = await res.json()
  return (data.files as Array<{ id: string; name: string }>)[0] || null
}

function buildMultipartBody(metadata: Record<string, any>, data: Buffer, mimeType: string) {
  const boundary = `BOUNDARY_${Date.now().toString(36)}`
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    "utf-8",
  )
  const closing = Buffer.from(`\r\n--${boundary}--`, "utf-8")
  const body = Buffer.concat([preamble, data, closing])
  return { body, boundary }
}

export async function uploadFileMultipart(
  token: string,
  params: {
    name: string
    parentId: string
    mimeType: string
    data: Buffer
    fileId?: string
  },
) {
  const { name, parentId, mimeType, data, fileId } = params
  const metadata: Record<string, any> = fileId ? { name } : { name, parents: [parentId] }
  const { body, boundary } = buildMultipartBody(metadata, data, mimeType)

  const url = fileId
    ? `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=multipart`
    : `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`

  const res = await fetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive upload failed (${res.status}): ${text}`)
  }

  return (await res.json()) as { id: string }
}

const DATA_URL_REGEX = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/

export function parseDataUrl(dataUrl: string) {
  const match = DATA_URL_REGEX.exec(dataUrl || "")
  if (!match?.groups) {
    throw new Error("Invalid data URL payload")
  }
  const mimeType = match.groups.mime
  const base64Data = match.groups.data
  const buffer = Buffer.from(base64Data, "base64")
  return { mimeType, buffer }
}

export function extensionFromMime(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "application/json":
      return "json"
    default:
      return "bin"
  }
}

export async function deleteDriveFile(token: string, fileId: string) {
  const res = await driveFetch(token, `/files/${fileId}`, {
    method: "DELETE",
  })
  if (res.status === 404) {
    return false
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive delete failed (${res.status}): ${text}`)
  }
  return true
}
