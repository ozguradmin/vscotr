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
    if (url.includes('/storage/buckets/') && url.includes('/files/')) {
        // FAST FIX: Bypass wsrv.nl for Appwrite Cloud URLs as they seem to fail with the proxy
        // This ensures legacy images (before R2 migration) still load directly from Appwrite
        return url;
    }

    // Handle generic URLs (including R2, external links etc.)
    // Weserv works great with R2 public URLs too!
    try {
        const weservUrl = new URL(WESERV_BASE_URL)
        weservUrl.searchParams.set('url', url)

        // Standardize weserv params
        if (options.width) weservUrl.searchParams.set('w', options.width.toString())
        if (options.height) weservUrl.searchParams.set('h', options.height.toString())
        weservUrl.searchParams.set('q', (options.quality || 80).toString())
        weservUrl.searchParams.set('output', options.output || 'webp')
        if (options.width && options.height) weservUrl.searchParams.set('fit', 'cover')

        return weservUrl.toString()
    } catch (e) {
        // Validation error for URL or other issues, return original
        return url
    }
}
