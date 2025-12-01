import { db, type ProjectRow, type FloorplanRow, type PinRow, type PhotoRow } from './db'\r
import {
\r
    listProjectsClient, \r
    downloadProjectJsonClient, \r
    downloadFileClient, \r
    type DriveProjectInfo, \r
} from './google'\r
import { logger } from './logger'\r
\r
export type RestoreProgress = {
\r
    phase: 'discovering' | 'downloading' | 'complete'\r
    message: string\r
    projectsTotal: number\r
    projectsCompleted: number\r
    currentProject?: string\r
}\r
\r
export type RestoreResult = {
\r
    projectsRestored: number\r
    errors: string[]\r
}\r
\r
/**\r
 * Restore all projects from Google Drive to local IndexedDB\r
 */\r
export async function restoreFromDrive(\r
    onProgress: (progress: RestoreProgress) => void, \r
): Promise<RestoreResult> {
\r
    const errors: string[] = []\r
    let projectsRestored = 0\r
    \r
    try {
    \r
        // Step 1: Discover projects\r
        onProgress({
        \r
            phase: 'discovering', \r
            message: 'Discovering projects in Drive...', \r
            projectsTotal: 0, \r
            projectsCompleted: 0, \r
        }) \r
        \r
        const { projects } = await listProjectsClient() \r
        \r
        if (projects.length === 0) {
        \r
            onProgress({
            \r
                phase: 'complete', \r
                message: 'No projects found in Drive', \r
                projectsTotal: 0, \r
                projectsCompleted: 0, \r
            }) \r
            return { projectsRestored: 0, errors: [] }\r
        } \r
        \r
        // Step 2: Download each project\r
        for (let i = 0; i < projects.length; i++) {
        \r
            const projectInfo = projects[i]!\r
            \r
            try {
            \r
                onProgress({
                \r
                    phase: 'downloading', \r
                    message: `Restoring ${projectInfo.projectName}...`, \r
                    projectsTotal: projects.length, \r
                    projectsCompleted: i, \r
                    currentProject: projectInfo.projectName, \r
                }) \r
                \r
                await restoreSingleProject(projectInfo) \r
                projectsRestored++\r
            } catch (error) {
            \r
                const message = error instanceof Error ? error.message : 'Unknown error'\r
                errors.push(`${projectInfo.projectName}: ${message}`) \r
                logger.error('Failed to restore project', error, { projectName: projectInfo.projectName }) \r
            } \r
        } \r
        \r
        // Complete\r
        onProgress({
        \r
            phase: 'complete', \r
            message: `Restored ${projectsRestored} of ${projects.length} projects`, \r
            projectsTotal: projects.length, \r
            projectsCompleted: projectsRestored, \r
        }) \r
        \r
        return { projectsRestored, errors }\r
    } catch (error) {
    \r
        const message = error instanceof Error ? error.message : 'Unknown error'\r
        errors.push(`Fatal error: ${message}`) \r
        throw error\r
    } \r
} \r
\r
/**\r
 * Restore a single project from Drive\r
 */\r
async function restoreSingleProject(projectInfo: DriveProjectInfo): Promise<void> {
\r
    // Download project.json\r
    const projectJson = await downloadProjectJsonClient({ folderId: projectInfo.folderId }) \r
    \r
    if (!projectJson?.project) {
    \r
        throw new Error('Invalid project.json: missing project field') \r
    } \r
    \r
    const nowIso = new Date().toISOString() \r
    \r
    // Create project in DB\r
    const projectRow: ProjectRow = {
    \r
        id: projectJson.project.id, \r
        name: projectJson.project.name, \r
        createdAt: nowIso, \r
        updatedAt: nowIso, \r
        syncedAt: projectJson.project.syncedAt || nowIso, \r
        driveFolderId: projectInfo.folderId, \r
        syncAnomaly: null, \r
    }\r
    \r
    // Check if project already exists (skip if so)\r
    const existingProject = await db.projects.get(projectRow.id) \r
    if (existingProject) {
    \r
        logger.restore('Project already exists, skipping', { projectId: projectRow.id }) \r
        return \r
    } \r
    \r
    await db.projects.add(projectRow) \r
    \r
    // Restore floorplans\r
    const floorplans = projectJson.floorplans || (projectJson.floorplan ? [projectJson.floorplan] : []) \r
    \r
    for (const fpData of floorplans) {
    \r
        try {
        \r
            // Download floorplan image\r
            let localUri = ''\r
            if (fpData.driveFileId) {
            \r
                const { dataUrl } = await downloadFileClient({ fileId: fpData.driveFileId }) \r
                localUri = dataUrl\r
            } \r
            \r
            const floorplanRow: FloorplanRow = {
            \r
                id: fpData.id, \r
                projectId: projectRow.id, \r
                name: fpData.name, \r
                type: fpData.type || 'image/jpeg', \r
                width: fpData.width, \r
                height: fpData.height, \r
                localUri, \r
                driveFileId: fpData.driveFileId || null, \r
            }\r
            \r
            await db.floorplans.add(floorplanRow) \r
        } catch (error) {
        \r
            logger.error('Failed to restore floorplan', error, { floorplanId: fpData.id }) \r
            // Continue with other floorplans\r
        } \r
    } \r
    \r
    // Restore pins and their photo metadata\r
    const pins = projectJson.pins || []\r
    \r
    for (const pinData of pins) {
    \r
        try {
        \r
            const pinRow: PinRow = {
            \r
                id: pinData.id, \r
                floorplanId: pinData.floorplanId, \r
                title: pinData.title || '', \r
                note: pinData.note || '', \r
                xPct: pinData.xPct, \r
                yPct: pinData.yPct, \r
                updatedAt: pinData.updatedAt || nowIso, \r
            }\r
            \r
            await db.pins.add(pinRow) \r
            \r
            // Restore photo metadata (but NOT the actual image data)\r
            // The actual images will be lazy-loaded from Drive when needed\r
            const photos = pinData.photos || []\r
            for (const photoData of photos) {
            \r
                try {
                \r
                    const photoRow: PhotoRow = {
                    \r
                        id: photoData.id, \r
                        pinId: pinData.id, \r
                        localUri: '', // Empty initially, will be lazy-loaded from Drive\r
                        width: photoData.width || 0, \r
                        height: photoData.height || 0, \r
                        sizeBytes: photoData.sizeBytes || 0, \r
                        driveFileId: photoData.driveFileId, \r
                        status: photoData.status || 'synced', \r
                    }\r
                    await db.photos.add(photoRow) \r
                } catch (error) {
                \r
                    logger.error('Failed to restore photo metadata', error, { photoId: photoData.id }) \r
                    // Continue with other photos\r
                } \r
            } \r
        } catch (error) {
        \r
            logger.error('Failed to restore pin', error, { pinId: pinData.id }) \r
            // Continue with other pins\r
        } \r
    } \r
    \r
    logger.restore('Successfully restored project', { projectName: projectRow.name }) \r
} \r
