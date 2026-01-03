import { APPWRITE_CONFIG } from "./client"

// Cloudflare Worker URL
const CDN_URL = "https://vscotr-cdn.ozgurglr256.workers.dev";

interface OptimizeImageOptions {
    width?: number
    height?: number
    quality?: number
    gravity?: string
    output?: "jpg" | "jpeg" | "gif" | "png" | "webp"
}

/**
 * Generate optimized image URL using Cloudflare Worker CDN
 * This routes requests through Cloudflare caches to save Appwrite bandwidth.
 * The Worker proxies the request to Appwrite's /view endpoint and caches the result.
 */
export function getOptimizedImageUrl(url: string, options: OptimizeImageOptions = {}) {
    if (!url) return url

    // Check if it's an Appwrite Storage URL
    if (!url.includes('/storage/buckets/') || !url.includes('/files/')) {
        return url
    }

    try {
        // Extract fileId from URL
        // URL format: https://.../files/{fileId}/...
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')

        const filesIndex = pathParts.indexOf('files')
        if (filesIndex === -1 || filesIndex + 1 >= pathParts.length) {
            return url
        }
        const fileId = pathParts[filesIndex + 1]

        // Construct CDN URL: https://cdn-url/image/{fileId}
        const cdnUrl = new URL(`${CDN_URL}/image/${fileId}`)

        // Add params
        if (options.width) cdnUrl.searchParams.set('width', options.width.toString())
        if (options.height) cdnUrl.searchParams.set('height', options.height.toString())
        cdnUrl.searchParams.set('quality', (options.quality || 80).toString())

        // DEBUG
        if (typeof window !== 'undefined') {
            // console.log('[ImageOpt] CDN URL:', cdnUrl.toString())
        }

        return cdnUrl.toString()

    } catch (e) {
        console.error("Error generating CDN URL:", e)
        return url
    }
}
