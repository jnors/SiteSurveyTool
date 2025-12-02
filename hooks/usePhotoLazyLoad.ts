import { useEffect, useState, useRef } from 'react'
import { lazyLoadPhoto } from '@/lib/lazy-load-photo'
import type { PinPhoto } from '@/lib/types'

/**
 * Hook to lazy-load photos from Google Drive
 * Returns photo URIs, loading them in the background if needed
 */
export function usePhotoLazyLoad(photos: PinPhoto[]) {
    const [photoUris, setPhotoUris] = useState<Map<string, string>>(new Map())
    const loadingRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        console.log('[usePhotoLazyLoad] Hook called with photos:', photos.length)

        // Find photos that need loading (empty localUri but have driveFileId)
        const photosToLoad = photos.filter(
            (photo) => {
                const needsLoading = !photo.localUri && photo.driveFileId && !loadingRef.current.has(photo.photoId)
                console.log('[usePhotoLazyLoad] Photo check:', {
                    photoId: photo.photoId,
                    hasLocalUri: !!photo.localUri,
                    localUriLength: photo.localUri?.length || 0,
                    hasDriveFileId: !!photo.driveFileId,
                    alreadyLoading: loadingRef.current.has(photo.photoId),
                    needsLoading
                })
                return needsLoading
            }
        )

        console.log('[usePhotoLazyLoad] Photos to load:', photosToLoad.length)

        if (photosToLoad.length === 0) {
            return
        }

        // Mark as loading (using ref to avoid dependency issues)
        photosToLoad.forEach((photo) => {
            console.log('[usePhotoLazyLoad] Starting load for:', photo.photoId)
            loadingRef.current.add(photo.photoId)
        })

        // Load each photo
        Promise.all(
            photosToLoad.map(async (photo) => {
                try {
                    console.log('[usePhotoLazyLoad] Calling lazyLoadPhoto for:', photo.photoId)
                    const uri = await lazyLoadPhoto(photo.photoId)
                    console.log('[usePhotoLazyLoad] Got URI:', uri ? `SUCCESS (${uri.substring(0, 50)}...)` : 'EMPTY')
                    if (uri) {
                        setPhotoUris((prev) => {
                            const next = new Map(prev)
                            next.set(photo.photoId, uri)
                            console.log('[usePhotoLazyLoad] Updated photoUris map, size:', next.size)
                            return next
                        })
                    }
                } catch (error) {
                    console.error(`[usePhotoLazyLoad] Failed to load photo ${photo.photoId}:`, error)
                } finally {
                    loadingRef.current.delete(photo.photoId)
                }
            })
        )
    }, [photos])

    // Return URIs for photos, using loaded URI if available, otherwise localUri or placeholder
    const getPhotoUri = (photo: PinPhoto): string => {
        const loadedUri = photoUris.get(photo.photoId)
        const result = loadedUri || photo.localUri || '/placeholder.svg'
        console.log('[usePhotoLazyLoad] getPhotoUri for:', photo.photoId, '→',
            result === '/placeholder.svg' ? 'PLACEHOLDER' :
                result.substring(0, 30) + '...')
        return result
    }

    return { getPhotoUri, isLoading: (photoId: string) => loadingRef.current.has(photoId) }
}
