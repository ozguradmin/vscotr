import { storage, APPWRITE_CONFIG } from "./client"
import { ImageFormat } from "appwrite"

interface OptimizeImageOptions {
    width?: number
    height?: number
    quality?: number
    gravity?: string
    output?: "jpg" | "jpeg" | "gif" | "png" | "webp"
}

/**
 * Generate optimized image URL using Appwrite SDK's getFilePreview
 * 
 * NOTE: CURRENTLY DISABLED - Appwrite /preview endpoint returns 404 "bucket not found"
 * even though the bucket exists and /view endpoint works fine.
 * This needs investigation with Appwrite support or console settings.
 * 
 * To re-enable: Remove the early return below when preview works.
 */
export function getOptimizedImageUrl(url: string, options: OptimizeImageOptions = {}) {
    // DISABLED: Appwrite preview returns 404. Return original URL until fixed.
    return url

    if (!url) return url

    // Check if it's an Appwrite Storage URL
    if (!url.includes('/storage/buckets/') || !url.includes('/files/')) {
        return url
    }

    try {
        // Extract fileId from URL
        // URL format: https://xxx.cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view?project=xxx
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')

        // Find 'files' in path and get the next segment as fileId
        const filesIndex = pathParts.indexOf('files')
        if (filesIndex === -1 || filesIndex + 1 >= pathParts.length) {
            return url
        }
        const fileId = pathParts[filesIndex + 1]

        // Find bucket ID
        const bucketsIndex = pathParts.indexOf('buckets')
        if (bucketsIndex === -1 || bucketsIndex + 1 >= pathParts.length) {
            return url
        }
        const bucketId = pathParts[bucketsIndex + 1]

        // Map output format to Appwrite ImageFormat
        let outputFormat: ImageFormat | undefined
        switch (options.output) {
            case 'webp': outputFormat = ImageFormat.Webp; break
            case 'jpg': case 'jpeg': outputFormat = ImageFormat.Jpg; break
            case 'png': outputFormat = ImageFormat.Png; break
            case 'gif': outputFormat = ImageFormat.Gif; break
            default: outputFormat = ImageFormat.Webp // Default to webp
        }

        // Use Appwrite SDK to generate proper preview URL
        const previewUrl = storage.getFilePreview(
            bucketId,
            fileId,
            options.width || undefined,  // width
            options.height || undefined, // height
            undefined, // gravity
            options.quality || 80, // quality
            undefined, // borderWidth
            undefined, // borderColor
            undefined, // borderRadius
            undefined, // opacity
            undefined, // rotation
            undefined, // background
            outputFormat // output format
        )

        // DEBUG
        if (typeof window !== 'undefined') {
            console.log('[ImageOpt] SDK URL:', previewUrl.toString().substring(0, 100) + '...')
        }

        return previewUrl.toString()
    } catch (e) {
        console.error("Error optimizing image URL:", e)
        return url
    }
}
