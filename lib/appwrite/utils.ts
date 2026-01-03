import { APPWRITE_CONFIG } from "./client"

interface OptimizeImageOptions {
    width?: number
    height?: number
    quality?: number
    gravity?: string
    output?: "jpg" | "jpeg" | "gif" | "png" | "webp"
}

export function getOptimizedImageUrl(url: string, options: OptimizeImageOptions = {}) {
    if (!url) return url

    // Check if it's an Appwrite Storage URL
    if (!url.includes('/storage/buckets/') || !url.includes('/files/')) {
        return url
    }

    try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname

        // Handle different URL formats:
        // Format 1: /storage/buckets/{bucketId}/files/{fileId}/view
        // Format 2: /storage/buckets/{bucketId}/files/{fileId} (no view suffix)
        // Target:   /storage/buckets/{bucketId}/files/{fileId}/preview

        if (pathname.endsWith('/view')) {
            urlObj.pathname = pathname.replace('/view', '/preview')
        } else if (pathname.endsWith('/preview')) {
            // Already preview, do nothing
        } else {
            // No /view or /preview suffix - append /preview
            urlObj.pathname = pathname + '/preview'
        }

        // Add optimization params
        if (options.width) urlObj.searchParams.set('width', options.width.toString())
        if (options.height) urlObj.searchParams.set('height', options.height.toString())
        urlObj.searchParams.set('quality', (options.quality || 80).toString())
        if (options.gravity) urlObj.searchParams.set('gravity', options.gravity)
        urlObj.searchParams.set('output', options.output || 'webp')

        // Ensure project ID is present
        const currentProject = urlObj.searchParams.get('project')
        const envProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

        if (!currentProject && envProject) {
            urlObj.searchParams.set('project', envProject)
        }

        // Remove mode param if exists
        if (urlObj.searchParams.has('mode')) {
            urlObj.searchParams.delete('mode')
        }

        const result = urlObj.toString()

        // DEBUG: Show full path difference
        if (typeof window !== 'undefined' && url !== result) {
            console.log('[ImageOpt] Path:', pathname, '->', urlObj.pathname)
            console.log('[ImageOpt] Params:', urlObj.search)
        }

        return result
    } catch (e) {
        console.error("Error optimizing image URL:", e)
        return url
    }
}
