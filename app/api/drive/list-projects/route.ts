import { NextResponse } from 'next/server'

import { requireServerAccessToken } from '@/sync/drive'
import { DRIVE_ROOT_NAME } from '@/core'
import { createClient } from '@/lib/supabase/server'

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

type ListProjectsResult = {
    projects: Array<{
        folderId: string
        folderName: string
        projectId: string
        projectName: string
    }>
}

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

async function findFolderByName(token: string, name: string, parentId: string) {
    const q = new URLSearchParams({
        q: `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
        fields: 'files(id, name)',
        pageSize: '10',
        spaces: 'drive',
    })
    const res = await driveFetch(token, `${DRIVE_BASE}/files?${q.toString()}`)
    if (!res.ok) throw new Error(`Drive search failed: ${res.status}`)
    const data = await res.json()
    return (data.files as Array<{ id: string; name: string }>)[0] || null
}

async function listFoldersInParent(token: string, parentId: string) {
    const q = new URLSearchParams({
        q: `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
        fields: 'files(id, name)',
        pageSize: '1000',
        spaces: 'drive',
    })
    const res = await driveFetch(token, `${DRIVE_BASE}/files?${q.toString()}`)
    if (!res.ok) throw new Error(`Drive list failed: ${res.status}`)
    const data = await res.json()
    return (data.files as Array<{ id: string; name: string }>) || []
}

export async function GET() {
    let token: string
    try {
        token = await requireServerAccessToken()
    } catch {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    // Get Supabase client and user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    try {
        // Try to get root folder ID from database first (for drive.file scope compatibility)
        const { data: profile } = await supabase
            .from('profiles')
            .select('drive_root_folder_id')
            .eq('id', user.id)
            .single()

        let rootId: string | null = null

        // If we have a stored folder ID, use it directly
        if (profile?.drive_root_folder_id) {
            rootId = profile.drive_root_folder_id
        } else {
            // Fall back to searching by name (for backward compatibility)
            const ROOT_NAME = DRIVE_ROOT_NAME
            const ROOT_PARENT = 'root'
            const root = await findFolderByName(token, ROOT_NAME, ROOT_PARENT)

            if (!root) {
                // No root folder, user has no projects
                return NextResponse.json({ projects: [] } satisfies ListProjectsResult)
            }

            rootId = root.id

            // Store it for future use
            await supabase
                .from('profiles')
                .update({ drive_root_folder_id: rootId })
                .eq('id', user.id)
        }

        // List all folders under root (rootId is guaranteed to be non-null here)
        const folders = await listFoldersInParent(token, rootId!)

        // Parse folder names (format: "ProjectName__projectId")
        const projects = folders
            .map((folder) => {
                const parts = folder.name.split('__')
                if (parts.length < 2) {
                    // Malformed folder name, skip
                    console.warn('[list-projects] Skipping malformed folder:', folder.name)
                    return null
                }

                const projectId = parts[parts.length - 1] // Last part is ID
                const projectName = parts.slice(0, -1).join('__') // Everything before is name

                return {
                    folderId: folder.id,
                    folderName: folder.name,
                    projectId: projectId!,
                    projectName,
                }
            })
            .filter((p) => p !== null)

        return NextResponse.json({ projects } satisfies ListProjectsResult)
    } catch (error) {
        console.error('[list-projects] Error:', error)
        return NextResponse.json(
            { error: 'Failed to list projects from Drive' },
            { status: 500 },
        )
    }
}
