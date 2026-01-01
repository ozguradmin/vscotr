"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Menu, X, Heart, RotateCcw } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useCache } from "@/lib/cache-context"
import Link from "next/link"

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

interface FeedViewProps {
  posts: Post[]
  currentUserId: string
  currentUsername?: string
}

export function FeedView({ posts, currentUserId, currentUsername }: FeedViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [postStates, setPostStates] = useState<
    Record<string, { liked: boolean; reposted: boolean; likesCount: number }>
  >({})
  const [visiblePosts, setVisiblePosts] = useState<Set<string>>(new Set())
  const router = useRouter()
  const pathname = usePathname()
  const mainRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const cache = useCache()
  const cacheKey = `feed-states-${currentUserId}`

  useEffect(() => {
    window.scrollTo(0, 0)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-post-id")
            if (postId) {
              setVisiblePosts((prev) => new Set(prev).add(postId))
            }
          }
        })
      },
      { rootMargin: "200px" },
    )

    return () => observerRef.current?.disconnect()
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
    if (Object.keys(postStates).length > 0) {
      cache.set(cacheKey, postStates, 300) // 5 dakika cache
    }
  }, [postStates])

  const loadPostStates = async () => {
    const postIds = posts.map((p) => p.id)

    const [likesResult, repostsResult, likeCountsResult] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
      supabase.from("reposts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
      supabase.from("likes").select("post_id").in("post_id", postIds),
    ])

    const likedPosts = new Set(likesResult.data?.map((l) => l.post_id) || [])
    const repostedPosts = new Set(repostsResult.data?.map((r) => r.post_id) || [])
    const likeCountMap: Record<string, number> = {}
    likeCountsResult.data?.forEach((l) => {
      likeCountMap[l.post_id] = (likeCountMap[l.post_id] || 0) + 1
    })

    const states: Record<string, { liked: boolean; reposted: boolean; likesCount: number }> = {}
    posts.forEach((post) => {
      states[post.id] = {
        liked: likedPosts.has(post.id),
        reposted: repostedPosts.has(post.id),
        likesCount: likeCountMap[post.id] || 0,
      }
    })
    setPostStates(states)
  }

  const handleRepost = async (postId: string) => {
    if (!currentUserId) {
      router.push("/giris")
      return
    }

    const currentState = postStates[postId]

    if (currentState?.reposted) {
      await supabase.from("reposts").delete().eq("user_id", currentUserId).eq("post_id", postId)
      setPostStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], reposted: false },
      }))
    } else {
      await supabase.from("reposts").insert({ user_id: currentUserId, post_id: postId })
      setPostStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], reposted: true },
      }))
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      router.push("/giris")
      return
    }

    const currentState = postStates[postId]

    if (currentState?.liked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", postId)
      setPostStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], liked: false, likesCount: Math.max(0, prev[postId].likesCount - 1) },
      }))
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId })
      setPostStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], liked: true, likesCount: (prev[postId]?.likesCount || 0) + 1 },
      }))
    }
  }

  const handleHeaderClick = () => {
    if (pathname === "/akis") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => router.refresh(), 300)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const observePost = useCallback((node: HTMLElement | null) => {
    if (node && observerRef.current) {
      observerRef.current.observe(node)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <button onClick={handleHeaderClick} className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold">VSCO TR</span>
          </button>
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

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
      />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="max-w-2xl mx-auto" ref={mainRef}>
        <h1 className="text-2xl font-light p-4 border-b border-border">Akış</h1>

        {posts.length > 0 ? (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <article key={post.id} className="pb-6" ref={observePost} data-post-id={post.id}>
                {visiblePosts.has(post.id) ? (
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || ""}
                    className="w-full h-auto"
                    style={{ aspectRatio: post.aspect_ratio || 1 }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full bg-muted animate-pulse" style={{ aspectRatio: post.aspect_ratio || 1 }} />
                )}

                <div className="px-4 pt-3 pb-4 md:pb-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/${post.profiles.username}`} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {post.profiles.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            {post.profiles.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{post.profiles.username}</span>
                        {post.profiles.member_badge && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            {post.profiles.member_badge}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`p-2 hover:bg-accent rounded-full transition-colors ${postStates[post.id]?.liked ? "text-red-500" : ""
                          }`}
                      >
                        <Heart className={`w-5 h-5 ${postStates[post.id]?.liked ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleRepost(post.id)}
                        className={`p-2 hover:bg-accent rounded-full transition-colors ${postStates[post.id]?.reposted ? "text-green-500" : ""
                          }`}
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {post.post_date && <p className="text-sm text-muted-foreground mt-2">{formatDate(post.post_date)}</p>}
                  {post.caption && <p className="text-sm mt-2 break-words">{post.caption}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground px-4">
            <p className="text-lg mb-2">Akışın boş</p>
            <p className="text-sm">Gönderileri görmek için kullanıcıları takip et.</p>
            <Link
              href="/kesfet"
              className="inline-block mt-4 px-6 py-2 bg-foreground text-background text-sm font-medium"
            >
              Keşfet
            </Link>
          </div>
        )}
      </main>

      <MobileTabBar currentUserId={currentUserId} username={currentUsername} />
    </div>
  )
}
