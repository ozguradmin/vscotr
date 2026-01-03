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
    // Typical format: .../storage/buckets/:bucketId/files/:fileId/view...
    if (!url.includes('/storage/buckets/') || !url.includes('/files/')) {
        return url
    }

    try {
        const urlObj = new URL(url)

        // Switch from 'view' to 'preview' for transformations if it is a view url
        // Appwrite uses /view for original download/view, /preview for transformations
        if (urlObj.pathname.endsWith('/view')) {
            urlObj.pathname = urlObj.pathname.replace('/view', '/preview')
        }

        // Add optimization params
        if (options.width) urlObj.searchParams.set('width', options.width.toString())
        if (options.height) urlObj.searchParams.set('height', options.height.toString())
        if (options.quality) urlObj.searchParams.set('quality', options.quality.toString())
        if (options.gravity) urlObj.searchParams.set('gravity', options.gravity)
        if (options.output) urlObj.searchParams.set('output', options.output)
        else urlObj.searchParams.set('output', 'webp') // Default to WebP for best compression

        // Ensure project ID is preserved or added if missing (usually in search params)
        // Client SDK usually handles this, but raw URLs might need it if we are manipulating strings.
        // Assuming the input URL already has the project param from the SDK logic.

        return urlObj.toString()
    } catch (e) {
        console.error("Error optimizing image URL:", e)
        return url
    }
}
