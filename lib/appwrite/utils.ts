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

        // Switch from 'view' to 'preview' for transformations
        if (urlObj.pathname.endsWith('/view')) {
            urlObj.pathname = urlObj.pathname.replace('/view', '/preview')
        }

        // Add optimization params
        if (options.width) urlObj.searchParams.set('width', options.width.toString())
        if (options.height) urlObj.searchParams.set('height', options.height.toString())
        if (options.quality) urlObj.searchParams.set('quality', (options.quality || 80).toString())
        if (options.gravity) urlObj.searchParams.set('gravity', options.gravity)
        if (options.output) urlObj.searchParams.set('output', options.output)
        else urlObj.searchParams.set('output', 'webp')

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

        // DEBUG: Log to see what URL is being generated (remove after fix)
        if (typeof window !== 'undefined') {
            console.log('[ImageOptimization] Original:', url.substring(0, 80) + '...')
            console.log('[ImageOptimization] Optimized:', result.substring(0, 80) + '...')
        }

        return result
    } catch (e) {
        console.error("Error optimizing image URL:", e)
        return url
    }
}
