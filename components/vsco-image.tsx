"use client"

import { useState, useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

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
    quality = 75,
    priority = false,
}: VscoImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

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
                src={error ? "/placeholder.svg" : src}
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
