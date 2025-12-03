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
        // Find photos that need loading (empty localUri but have driveFileId)
        const photosToLoad = photos.filter(
            (photo) => !photo.localUri && photo.driveFileId && !loadingRef.current.has(photo.photoId)
        )

        if (photosToLoad.length === 0) {
            return
        }

        // Mark as loading (using ref to avoid dependency issues)
        photosToLoad.forEach((photo) => {
            loadingRef.current.add(photo.photoId)
        })

        // Load each photo
        Promise.all(
            photosToLoad.map(async (photo) => {
                try {
                    const uri = await lazyLoadPhoto(photo.photoId)
                    if (uri) {
                        setPhotoUris((prev) => {
                            const next = new Map(prev)
                            next.set(photo.photoId, uri)
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
        return loadedUri || photo.localUri || '/placeholder.svg'
    }

    return { getPhotoUri, isLoading: (photoId: string) => loadingRef.current.has(photoId) }
}
