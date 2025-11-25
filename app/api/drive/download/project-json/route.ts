import { NextResponse } from 'next/server'

import { requireServerAccessToken } from '@/sync/drive'

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

async function driveFetch(token: string, url: string, init?: RequestInit) {
    const res = await fetch(url, {
        ...init,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        cache: 'no-store',
    })
    return res
}

async function listFilesInFolder(token: string, folderId: string, fileName: string) {
    const q = new URLSearchParams({
        q: `name = '${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        pageSize: '10',
        spaces: 'drive',
    })
    const res = await driveFetch(token, `${DRIVE_BASE}/files?${q.toString()}`)
    if (!res.ok) throw new Error(`Drive search failed: ${res.status}`)
    const data = await res.json()
    return (data.files as Array<{ id: string; name: string; mimeType: string }>)[0] || null
}

async function downloadFile(token: string, fileId: string) {
    const res = await driveFetch(token, `${DRIVE_BASE}/files/${fileId}?alt=media`)
    if (!res.ok) throw new Error(`Drive download failed: ${res.status}`)
    return res.text()
}

export async function GET(req: Request) {
    let token: string
    try {
        token = await requireServerAccessToken()
    } catch {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folderId')

    if (!folderId) {
        return NextResponse.json({ error: 'Missing folderId parameter' }, { status: 400 })
    }

    try {
        // Find project.json file in folder
        const file = await listFilesInFolder(token, folderId, 'project.json')

        if (!file) {
            return NextResponse.json({ error: 'project.json not found' }, { status: 404 })
        }

        // Download and parse JSON
        const content = await downloadFile(token, file.id)
        const json = JSON.parse(content)

        return NextResponse.json(json)
    } catch (error) {
        console.error('[download-project-json] Error:', error)
        return NextResponse.json(
            { error: 'Failed to download project.json' },
            { status: 500 },
        )
    }
}
