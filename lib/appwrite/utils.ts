import { APPWRITE_CONFIG } from "./client"

// Using wsrv.nl (Open source image proxy)
// Benefits:
// 1. Resizes images on the fly (fixes LCP/speed issue)
// 2. Converts to WebP (fixes size issue)
// 3. Caches images (fixes Appwrite bandwidth issue)
// 4. Free and requires no API key
const WESERV_BASE_URL = "https://wsrv.nl";

interface OptimizeImageOptions {
    width?: number
    height?: number
    quality?: number
    gravity?: string
    output?: "jpg" | "jpeg" | "gif" | "png" | "webp"
}

/**
 * Generate optimized image URL using wsrv.nl
 * This services fetches the original image from Appwrite, resizes/optimizes it, and serves it from cache.
 */
export function getOptimizedImageUrl(url: string, options: OptimizeImageOptions = {}) {
    if (!url) return url

    // Check if it's an Appwrite Storage URL
    if (!url.includes('/storage/buckets/') || !url.includes('/files/')) {
        return url
    }

    try {
        // 1. Construct the cleaning Appwrite Source URL (Original View URL)
        // We need to ensure it uses /view and has Project ID
        const urlObj = new URL(url)

        // Ensure /view endpoint
        if (urlObj.pathname.endsWith('/preview')) {
            urlObj.pathname = urlObj.pathname.replace('/preview', '/view')
        } else if (!urlObj.pathname.endsWith('/view')) {
            urlObj.pathname += '/view'
        }

        // Ensure Project ID is present (Crucial for Appwrite access)
        const currentProject = urlObj.searchParams.get('project')
        const envProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
        if (!currentProject && envProject) {
            urlObj.searchParams.set('project', envProject)
        }

        // Remove unnecessary params from source URL to keep detailed cache key clean
        urlObj.searchParams.delete('width')
        urlObj.searchParams.delete('height')
        urlObj.searchParams.delete('quality')
        urlObj.searchParams.delete('gravity')
        urlObj.searchParams.delete('output')
        urlObj.searchParams.delete('mode')

        const originalUrl = urlObj.toString()

        // 2. Construct Weserv URL
        // Docs: https://wohoo.github.io/weserv-docs/
        const weservUrl = new URL(WESERV_BASE_URL)
        weservUrl.searchParams.set('url', originalUrl)

        // Add optimization params
        if (options.width) weservUrl.searchParams.set('w', options.width.toString())
        if (options.height) weservUrl.searchParams.set('h', options.height.toString())
        weservUrl.searchParams.set('q', (options.quality || 80).toString())
        weservUrl.searchParams.set('output', options.output || 'webp')

        // 'l' = 0 (default) -> fits within width/height
        // 'fit' = cover -> strict crop if both dimensions provided
        if (options.width && options.height) {
            weservUrl.searchParams.set('fit', 'cover')
        }

        return weservUrl.toString()

    } catch (e) {
        console.error("Error generating Weserv URL:", e)
        return url
    }
}
