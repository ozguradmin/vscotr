"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Menu, X, Heart, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useCache } from "@/lib/cache-context"
import { VscoImage } from "@/components/vsco-image"

interface Post {
  id: string
  image_url: string
  caption: string | null
  aspect_ratio: number
  profiles: {
    id: string
    username: string
    avatar_url: string | null
    member_badge: string | null
  }
}

interface DiscoverViewProps {
  posts: Post[]
  currentUserId?: string
  currentUsername?: string | null
}

export function DiscoverView({ posts, currentUserId, currentUsername }: DiscoverViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [postStates, setPostStates] = useState<
    Record<string, { liked: boolean; reposted: boolean; following: boolean }>
  >({})

  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const cache = useCache()
  const cacheKey = `discover-states-${currentUserId || 'guest'}`

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (currentUserId && posts.length > 0) {
      // Önce cache'den yükle
      const cached = cache.get<typeof postStates>(cacheKey)
      if (cached && Object.keys(cached).length > 0) {
        setPostStates(cached)
      } else {
        loadPostStates()
      }
    }
  }, [currentUserId, posts])

  // Post states değiştiğinde cache'e kaydet
  useEffect(() => {
    if (Object.keys(postStates).length > 0 && currentUserId) {
      cache.set(cacheKey, postStates, 600) // 10 dakika cache
    }
  }, [postStates])

  const loadPostStates = async () => {
    const postIds = posts.map((p) => p.id)
    const userIds = posts.map((p) => p.profiles.id)

    const [likesResult, repostsResult, followsResult] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", currentUserId!).in("post_id", postIds),
      supabase.from("reposts").select("post_id").eq("user_id", currentUserId!).in("post_id", postIds),
      supabase.from("follows").select("following_id").eq("follower_id", currentUserId!).in("following_id", userIds),
    ])

    const likedPosts = new Set(likesResult.data?.map((l) => l.post_id) || [])
    const repostedPosts = new Set(repostsResult.data?.map((r) => r.post_id) || [])
    const followingUsers = new Set(followsResult.data?.map((f) => f.following_id) || [])

    const states: Record<string, { liked: boolean; reposted: boolean; following: boolean }> = {}
    posts.forEach((post) => {
      states[post.id] = {
        liked: likedPosts.has(post.id),
        reposted: repostedPosts.has(post.id),
        following: followingUsers.has(post.profiles.id),
      }
    })
    setPostStates(states)
  }

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      router.push("/giris")
      return
    }

    const post = posts.find((p) => p.id === postId)
    if (!post || post.profiles.id === currentUserId) return

    const currentState = postStates[postId]

    if (currentState?.liked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", postId)
      setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], liked: false } }))
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId })
      setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], liked: true } }))
    }
  }

  const handleRepost = async (postId: string) => {
    if (!currentUserId) {
      router.push("/giris")
      return
    }

    const post = posts.find((p) => p.id === postId)
    if (!post || post.profiles.id === currentUserId) return

    const currentState = postStates[postId]

    if (currentState?.reposted) {
      await supabase.from("reposts").delete().eq("user_id", currentUserId).eq("post_id", postId)
      setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], reposted: false } }))
    } else {
      await supabase.from("reposts").insert({ user_id: currentUserId, post_id: postId })
      setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], reposted: true } }))
    }
  }

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

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold">VSCO TR 7</span>
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
        <h1 className="text-2xl font-light mb-6">Keşfet</h1>

        {posts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
            {posts.map((post, index) => (
              <button
                key={post.id}
                onClick={() => setSelectedPostIndex(index)}
                className="block w-full break-inside-avoid group relative overflow-hidden"
              >
                <VscoImage
                  src={post.image_url || "/placeholder.svg"}
                  alt={post.caption || ""}
                  aspectRatio={post.aspect_ratio || 1}
                  className="w-full h-full"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                  <Link
                    href={`/${post.profiles.username}`}
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 relative">
                      {post.profiles.avatar_url ? (
                        <VscoImage
                          src={post.profiles.avatar_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-muted">
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
            <p>Henüz keşfedilecek içerik yok</p>
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
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative min-h-0 bg-background">
            <div className="relative w-full h-full max-h-[80vh]">
              <VscoImage
                src={selectedPost.image_url || "/placeholder.svg"}
                alt={selectedPost.caption || ""}
                layout="fill"
                objectFit="contain"
                className="bg-transparent"
                quality={90}
                priority
              />
            </div>

            {selectedPostIndex > 0 && (
              <button
                onClick={() => navigatePost("prev")}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedPostIndex < posts.length - 1 && (
              <button
                onClick={() => navigatePost("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="fixed md:relative bottom-16 md:bottom-0 left-0 right-0 bg-background border-t border-border z-10 flex-shrink-0">
            {/* User info at bottom left */}
            <div className="p-4 flex items-start justify-between gap-4">
              <Link
                href={`/${selectedPost.profiles.username}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                  {selectedPost.profiles.avatar_url ? (
                    <VscoImage
                      src={selectedPost.profiles.avatar_url || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground bg-muted">
                      {selectedPost.profiles.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedPost.profiles.username}</p>
                  {selectedPost.profiles.member_badge && (
                    <p className="text-xs text-muted-foreground uppercase">{selectedPost.profiles.member_badge}</p>
                  )}
                  {selectedPost.caption && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedPost.caption}</p>
                  )}
                </div>
              </Link>

              {/* Like & Repost buttons at bottom right */}
              {currentUserId && selectedPost.profiles.id !== currentUserId && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`p-2 hover:bg-accent rounded-full transition-colors ${postStates[selectedPost.id]?.liked ? "text-red-500" : ""
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${postStates[selectedPost.id]?.liked ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => handleRepost(selectedPost.id)}
                    className={`p-2 hover:bg-accent rounded-full transition-colors ${postStates[selectedPost.id]?.reposted ? "text-green-500" : ""
                      }`}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileTabBar currentUserId={currentUserId} username={currentUsername || undefined} />
    </div>
  )
}

