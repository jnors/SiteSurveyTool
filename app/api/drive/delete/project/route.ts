import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriveClient } from '@/lib/google-server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { driveFolderId } = await req.json()

        if (!driveFolderId) {
            return new NextResponse('Drive Folder ID is required', { status: 400 })
        }

        const drive = await getDriveClient()

        try {
            await drive.files.delete({
                fileId: driveFolderId,
            })
            return NextResponse.json({ deleted: true })
        } catch (error: any) {
            console.error('Google Drive Delete Error:', error)
            // If 404, it's already gone, so we consider it success
            if (error.code === 404) {
                return NextResponse.json({ deleted: true })
            }
            return new NextResponse(error.message || 'Failed to delete from Drive', { status: 500 })
        }
    } catch (error: any) {
        console.error('Delete Project Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
