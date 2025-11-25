import { NextResponse } from 'next/server'

import { requireServerAccessToken } from '@/sync/drive'

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

async function driveFetch(token: string, url: string, init?: RequestInit) {
    const res = await fetch(url, {
        ...init,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...(init?.headers || {}),
        },
        cache: 'no-store',
    })
    return res
}

async function downloadFileAsBase64(token: string, fileId: string) {
    const res = await driveFetch(token, `${DRIVE_BASE}/files/${fileId}?alt=media`)
    if (!res.ok) throw new Error(`Drive download failed: ${res.status}`)

    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Get file metadata to determine MIME type
    const metaRes = await driveFetch(token, `${DRIVE_BASE}/files/${fileId}?fields=mimeType`)
    const meta = await metaRes.json()
    const mimeType = meta.mimeType || 'application/octet-stream'

    return `data:${mimeType};base64,${base64}`
}

export async function GET(req: Request) {
    let token: string
    try {
        token = await requireServerAccessToken()
    } catch {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
        return NextResponse.json({ error: 'Missing fileId parameter' }, { status: 400 })
    }

    try {
        const dataUrl = await downloadFileAsBase64(token, fileId)
        return NextResponse.json({ dataUrl })
    } catch (error) {
        console.error('[download-file] Error:', error)
        return NextResponse.json(
            { error: 'Failed to download file' },
            { status: 500 },
        )
    }
}
