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

        // CRITICAL FIX: Appwrite Preview endpoint often returns 401 if project ID is missing from the query params of the URL
        // when accessed directly via <img> tag without SDK headers.
        // We must ensure 'project' param is present.
        const currentProject = urlObj.searchParams.get('project')
        const envProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

        if (!currentProject && envProject) {
            urlObj.searchParams.set('project', envProject)
        }

        // Remove mode=admin to prevent potential auth conflicts on client side
        if (urlObj.searchParams.has('mode')) {
            urlObj.searchParams.delete('mode')
        }

        return urlObj.toString()
    } catch (e) {
        console.error("Error optimizing image URL:", e)
        return url
    }
}
