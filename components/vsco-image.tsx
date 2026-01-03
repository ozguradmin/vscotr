"use client"

import { useState, useEffect, useRef, useMemo } from "react"

import { cn } from "@/lib/utils"
import { getOptimizedImageUrl } from "@/lib/appwrite/utils"

interface VscoImageProps {
    src: string
    alt: string
    aspectRatio?: number
    className?: string
    width?: number
    height?: number
    layout?: "fill" | "responsive"
    objectFit?: "cover" | "contain"
    quality?: number
    priority?: boolean
    optimize?: boolean
}

export function VscoImage({
    src,
    alt,
    aspectRatio,
    className,
    width,
    height,
    layout = "fill",
    objectFit = "cover",
    quality = 80,
    priority = false,
    optimize = true,
}: VscoImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    // Calculate optimized URL
    const optimizedSrc = useMemo(() => {
        if (!optimize || error) return src

        // Determine target dimensions
        // If width is explicitly provided, use it.
        // If layout is fill, we default to a reasonable high-res standard (e.g. 800px) 
        // to avoid fetching 4K images but still look good on mobile/desktop.
        // For specific small thumbnails, caller should pass width prop.
        const targetWidth = width || 800

        return getOptimizedImageUrl(src, {
            width: targetWidth,
            height: height,
            quality: quality,
            output: "webp"
        })
    }, [src, width, height, quality, optimize, error])

    // Aspect ratio style calculation
    const style = aspectRatio ? { aspectRatio } : undefined

    useEffect(() => {
        // Reset state when src changes
        setIsLoading(true)
        setError(false)

        // If image is already complete (cached), set loading to false immediately
        if (imgRef.current?.complete) {
            setIsLoading(false)
        }

        // Fallback timeout: If image doesn't load in 3 seconds, show it anyway (or assume broken/loaded)
        // This fixes issues where onLoad doesn't fire on some browsers/Safari specific cases
        const timeout = setTimeout(() => {
            setIsLoading(false)
        }, 3000)

        return () => clearTimeout(timeout)
    }, [src])

    return (
        <div
            className={cn("relative overflow-hidden bg-muted", className)}
            style={style}
        >
            {/* Skeleton / Loading State */}
            {isLoading && (
                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
                </div>
            )}

            <img
                ref={imgRef}
                src={error ? "/placeholder.svg" : optimizedSrc}
                alt={alt}
                className={cn(
                    "duration-500 ease-in-out",
                    objectFit === "cover" ? "object-cover" : "object-contain",
                    layout === "fill" ? "absolute inset-0 w-full h-full" : "",
                    isLoading ? "scale-105 opacity-0" : "scale-100 opacity-100",
                    className
                )}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setError(true)
                    setIsLoading(false)
                }}
                loading={priority ? "eager" : "lazy"}
            />
        </div>
    )
}
