"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import Link from "next/link"
import { VscoImage } from "@/components/vsco-image"

interface Post {
  id: string
  image_url: string
  caption: string | null
  post_date: string | null
  aspect_ratio: number
  profiles: {
    username: string
    avatar_url: string | null
    member_badge: string | null
  }
}

interface LikedPostsViewProps {
  posts: Post[]
  currentUserId: string
}

export function LikedPostsView({ posts, currentUserId }: LikedPostsViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const selectedPost = selectedPostIndex !== null ? posts[selectedPostIndex] : null

  const navigatePost = (direction: "prev" | "next") => {
    if (selectedPostIndex === null) return
    if (direction === "prev" && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1)
    } else if (direction === "next" && selectedPostIndex < posts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1)
    }
  }

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      navigatePost("next")
    }
    if (isRightSwipe) {
      navigatePost("prev")
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPostIndex === null) return
      if (e.key === "ArrowLeft") navigatePost("prev")
      if (e.key === "ArrowRight") navigatePost("next")
      if (e.key === "Escape") setSelectedPostIndex(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedPostIndex, posts.length])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <Link href="/akis" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold">VSCO TR</span>
          </Link>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-accent rounded-full transition-colors" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} currentUserId={currentUserId} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-light mb-6">Beğendiğim Gönderiler</h1>

        {posts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
            {posts.map((post, index) => (
              <button
                key={post.id}
                onClick={() => setSelectedPostIndex(index)}
                className="block w-full overflow-hidden break-inside-avoid relative group"
              >
                <VscoImage
                  src={post.image_url || "/placeholder.svg"}
                  alt={post.caption || ""}
                  aspectRatio={post.aspect_ratio || 1}
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity p-2">
                  <Link
                    href={`/${post.profiles.username}`}
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {post.profiles.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                          {post.profiles.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white font-medium truncate">{post.profiles.username}</span>
                  </Link>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <p>Henüz beğendiğin gönderi yok</p>
          </div>
        )}
      </main>

      {selectedPost && selectedPostIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-end h-14 px-4 border-b border-border flex-shrink-0">
            <button onClick={() => setSelectedPostIndex(null)} className="p-2 hover:bg-accent rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative min-h-0">
            <div className="relative w-full h-full max-h-[80vh]">
              <VscoImage
                src={selectedPost.image_url || "/placeholder.svg"}
                alt={selectedPost.caption || ""}
                layout="fill"
                objectFit="contain"
                className="bg-transparent"
                quality={90}
              />
            </div>

            {selectedPostIndex > 0 && (
              <button
                onClick={() => navigatePost("prev")}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedPostIndex < posts.length - 1 && (
              <button
                onClick={() => navigatePost("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Modal Footer */}
          <div className="fixed md:relative bottom-16 md:bottom-0 left-0 right-0 p-4 border-t border-border bg-background z-10 flex-shrink-0">
            <div className="max-w-2xl mx-auto">
              <Link
                href={`/${selectedPost.profiles.username}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                  {selectedPost.profiles?.avatar_url ? (
                    <VscoImage
                      src={selectedPost.profiles.avatar_url || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground bg-muted">
                      {selectedPost.profiles?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{selectedPost.profiles.username}</p>
                  {selectedPost.profiles.member_badge && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {selectedPost.profiles.member_badge}
                    </span>
                  )}
                  {selectedPost.post_date && (
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedPost.post_date)}</p>
                  )}
                  {selectedPost.caption && (
                    <p className="text-sm text-muted-foreground mt-2 break-words">{selectedPost.caption}</p>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      <MobileTabBar currentUserId={currentUserId} />
    </div>
  )
}
