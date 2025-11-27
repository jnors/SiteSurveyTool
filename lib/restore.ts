import { db, type ProjectRow, type FloorplanRow, type PinRow } from './db'
import {
    listProjectsClient,
    downloadProjectJsonClient,
    downloadFileClient,
    type DriveProjectInfo,
} from './google'
import { logger } from './logger'

export type RestoreProgress = {
    phase: 'discovering' | 'downloading' | 'complete'
    message: string
    projectsTotal: number
    projectsCompleted: number
    currentProject?: string
}

export type RestoreResult = {
    projectsRestored: number
    errors: string[]
}

/**
 * Restore all projects from Google Drive to local IndexedDB
 */
export async function restoreFromDrive(
    onProgress: (progress: RestoreProgress) => void,
): Promise<RestoreResult> {
    const errors: string[] = []
    let projectsRestored = 0

    try {
        // Step 1: Discover projects
        onProgress({
            phase: 'discovering',
            message: 'Discovering projects in Drive...',
            projectsTotal: 0,
            projectsCompleted: 0,
        })

        const { projects } = await listProjectsClient()

        if (projects.length === 0) {
            onProgress({
                phase: 'complete',
                message: 'No projects found in Drive',
                projectsTotal: 0,
                projectsCompleted: 0,
            })
            return { projectsRestored: 0, errors: [] }
        }

        // Step 2: Download each project
        for (let i = 0; i < projects.length; i++) {
            const projectInfo = projects[i]!

            try {
                onProgress({
                    phase: 'downloading',
                    message: `Restoring ${projectInfo.projectName}...`,
                    projectsTotal: projects.length,
                    projectsCompleted: i,
                    currentProject: projectInfo.projectName,
                })

                await restoreSingleProject(projectInfo)
                projectsRestored++
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`${projectInfo.projectName}: ${message}`)
                logger.error('Failed to restore project', error, { projectName: projectInfo.projectName })
            }
        }

        // Complete
        onProgress({
            phase: 'complete',
            message: `Restored ${projectsRestored} of ${projects.length} projects`,
            projectsTotal: projects.length,
            projectsCompleted: projectsRestored,
        })

        return { projectsRestored, errors }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Fatal error: ${message}`)
        throw error
    }
}

/**
 * Restore a single project from Drive
 */
async function restoreSingleProject(projectInfo: DriveProjectInfo): Promise<void> {
    // Download project.json
    const projectJson = await downloadProjectJsonClient({ folderId: projectInfo.folderId })

    if (!projectJson?.project) {
        throw new Error('Invalid project.json: missing project field')
    }

    const nowIso = new Date().toISOString()

    // Create project in DB
    const projectRow: ProjectRow = {
        id: projectJson.project.id,
        name: projectJson.project.name,
        createdAt: nowIso,
        updatedAt: nowIso,
        syncedAt: projectJson.project.syncedAt || nowIso,
        driveFolderId: projectInfo.folderId,
        syncAnomaly: null,
    }

    // Check if project already exists (skip if so)
    const existingProject = await db.projects.get(projectRow.id)
    if (existingProject) {
        logger.restore('Project already exists, skipping', { projectId: projectRow.id })
        return
    }

    await db.projects.add(projectRow)

    // Restore floorplans
    const floorplans = projectJson.floorplans || (projectJson.floorplan ? [projectJson.floorplan] : [])

    for (const fpData of floorplans) {
        try {
            // Download floorplan image
            let localUri = ''
            if (fpData.driveFileId) {
                const { dataUrl } = await downloadFileClient({ fileId: fpData.driveFileId })
                localUri = dataUrl
            }

            const floorplanRow: FloorplanRow = {
                id: fpData.id,
                projectId: projectRow.id,
                name: fpData.name,
                type: fpData.type || 'image/jpeg',
                width: fpData.width,
                height: fpData.height,
                localUri,
                driveFileId: fpData.driveFileId || null,
            }

            await db.floorplans.add(floorplanRow)
        } catch (error) {
            logger.error('Failed to restore floorplan', error, { floorplanId: fpData.id })
            // Continue with other floorplans
        }
    }

    // Restore pins (but NOT photos - those are lazy-loaded)
    const pins = projectJson.pins || []

    for (const pinData of pins) {
        try {
            const pinRow: PinRow = {
                id: pinData.id,
                floorplanId: pinData.floorplanId,
                title: pinData.title || '',
                note: pinData.note || '',
                xPct: pinData.xPct,
                yPct: pinData.yPct,
                updatedAt: pinData.updatedAt || nowIso,
            }

            await db.pins.add(pinRow)

            // Note: We're NOT downloading photos here
            // They can be lazy-loaded when the user opens a pin
        } catch (error) {
            logger.error('Failed to restore pin', error, { pinId: pinData.id })
            // Continue with other pins
        }
    }

    // Set active floorplan
    if (projectJson.project.activeFloorplanId) {
        await db.projects.update(projectRow.id, {
            activeFloorplanId: projectJson.project.activeFloorplanId,
        })
    }

    logger.restore('Successfully restored project', { projectName: projectRow.name })
}
