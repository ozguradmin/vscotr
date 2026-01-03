import { APPWRITE_CONFIG } from "./client"

interface OptimizeImageOptions {
    width?: number
    height?: number
    quality?: number
    gravity?: string
    output?: "jpg" | "jpeg" | "gif" | "png" | "webp"
}

export function getOptimizedImageUrl(url: string, options: OptimizeImageOptions = {}) {
    // TEMPORARILY DISABLED: Appwrite /preview endpoint returns 401 error
    // even with project ID. This needs bucket permission fix on Appwrite console.
    // Once fixed, remove this return statement.
    return url

    // --- ORIGINAL OPTIMIZATION CODE (DISABLED) ---
    /*
    if (!url) return url

    if (!url.includes('/storage/buckets/') || !url.includes('/files/')) {
        return url
    }

    try {
        const urlObj = new URL(url)

        if (urlObj.pathname.endsWith('/view')) {
            urlObj.pathname = urlObj.pathname.replace('/view', '/preview')
        }

        if (options.width) urlObj.searchParams.set('width', options.width.toString())
        if (options.height) urlObj.searchParams.set('height', options.height.toString())
        if (options.quality) urlObj.searchParams.set('quality', options.quality.toString())
        if (options.gravity) urlObj.searchParams.set('gravity', options.gravity)
        if (options.output) urlObj.searchParams.set('output', options.output)
        else urlObj.searchParams.set('output', 'webp')

        const currentProject = urlObj.searchParams.get('project')
        const envProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

        if (!currentProject && envProject) {
            urlObj.searchParams.set('project', envProject)
        }

        if (urlObj.searchParams.has('mode')) {
            urlObj.searchParams.delete('mode')
        }

        return urlObj.toString()
    } catch (e) {
        console.error("Error optimizing image URL:", e)
        return url
    }
    */
}
