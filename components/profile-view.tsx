"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Search,
  Menu,
  X,
  Share2,
  Grid,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { SettingsModal } from "@/components/settings-modal"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCache } from "@/lib/cache-context"
import { VscoImage } from "@/components/vsco-image"

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  member_badge: string | null
}

interface Post {
  id: string
  image_url: string
  caption: string | null
  aspect_ratio: number
  created_at: string
}

interface ProfileViewProps {
  profile: Profile
  isOwner: boolean
  posts: Post[]
  reposts: Post[]
  currentUserId?: string
  currentUsername?: string
}

export function ProfileView({
  profile,
  isOwner,
  posts: initialPosts,
  reposts: initialReposts,
  currentUserId,
  currentUsername,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "reposts">("posts")
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [postStates, setPostStates] = useState<Record<string, { liked: boolean; reposted: boolean }>>({})
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const cache = useCache()
  const cacheKey = `profile-states-${currentUserId || 'guest'}-${profile.id}`

  const currentPosts = activeTab === "posts" ? initialPosts : initialReposts

  useEffect(() => {
    window.scrollTo(0, 0)
    checkFollowStatus()
  }, [currentUserId, profile.id])

  useEffect(() => {
    if (currentUserId && currentPosts.length > 0) {
      // Load from cache first
      const cached = cache.get<typeof postStates>(cacheKey)
      if (cached && Object.keys(cached).length > 0) {
        setPostStates(cached)
      } else {
        loadPostStates()
      }
    }
  }, [currentUserId, currentPosts, activeTab])

  useEffect(() => {
    if (Object.keys(postStates).length > 0 && currentUserId) {
      cache.set(cacheKey, postStates, 600) // 10 min cache
    }
  }, [postStates])

  const checkFollowStatus = async () => {
    if (!currentUserId) return
    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", currentUserId)
      .eq("following_id", profile.id)
      .single()
    setIsFollowing(!!data)
  }

  const loadPostStates = async () => {
    if (!currentUserId || currentPosts.length === 0) return

    const postIds = currentPosts.map((p) => p.id)

    const [likesResult, repostsResult] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
      supabase.from("reposts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
    ])

    const likedPosts = new Set(likesResult.data?.map((l) => l.post_id) || [])
    const repostedPosts = new Set(repostsResult.data?.map((r) => r.post_id) || [])

    const states: Record<string, { liked: boolean; reposted: boolean }> = {}
    currentPosts.forEach((post) => {
      states[post.id] = {
        liked: likedPosts.has(post.id),
        reposted: repostedPosts.has(post.id),
      }
    })
    setPostStates((prev) => ({ ...prev, ...states }))
  }

  const handleFollow = async () => {
    if (!currentUserId) {
      router.push("/giris")
      return
    }

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profile.id)
      setIsFollowing(false)
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: profile.id,
      })
      setIsFollowing(true)
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

    const currentState = postStates[postId]

    if (currentState?.reposted) {
      await supabase.from("reposts").delete().eq("user_id", currentUserId).eq("post_id", postId)
      setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], reposted: false } }))
    } else {
      await supabase.from("reposts").insert({ user_id: currentUserId, post_id: postId })
      setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], reposted: true } }))
    }
  }

  const selectedPost = selectedPostIndex !== null ? currentPosts[selectedPostIndex] : null

  const navigatePost = (direction: "prev" | "next") => {
    if (selectedPostIndex === null) return
    if (direction === "prev" && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1)
    } else if (direction === "next" && selectedPostIndex < currentPosts.length - 1) {
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

    if (isLeftSwipe) navigatePost("next")
    if (isRightSwipe) navigatePost("prev")
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
  }, [selectedPostIndex, currentPosts.length])

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold">VSCO TR 7</span>
          </Link>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-accent rounded-full transition-colors" onClick={() => setSearchOpen(true)} aria-label="Arama">
              <Search className="w-6 h-6" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        currentProfile={profile}
      />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-4 md:gap-8 mb-8 md:mb-12 px-4 md:px-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden relative border border-border">
              {profile.avatar_url ? (
                <VscoImage
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground bg-muted">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-xl md:text-2xl font-light leading-none mb-1">{profile.display_name || profile.username}</h1>
            <p className="text-sm text-muted-foreground mb-3">@{profile.username}</p>
            {profile.bio && <p className="text-sm whitespace-pre-wrap mb-4 max-w-md">{profile.bio}</p>}

            {isOwner ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="px-4 py-1.5 border border-border text-xs font-medium hover:bg-accent transition-colors uppercase tracking-wider"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert("Profil linki kopyalandı!");
                  }}
                  className="p-1.5 border border-border hover:bg-accent transition-colors rounded-full"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-1.5 text-xs font-medium transition-colors uppercase tracking-wider ${isFollowing
                    ? "border border-border hover:bg-accent"
                    : "bg-foreground text-background hover:opacity-90"
                    }`}
                >
                  {isFollowing ? "Takipte" : "Takip Et"}
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert("Profil linki kopyalandı!");
                  }}
                  className="p-1.5 border border-border hover:bg-accent transition-colors rounded-full"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 pb-3 text-sm font-medium uppercase tracking-wider transition-colors ${activeTab === "posts" ? "border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Grid className="w-4 h-4" />
              <span>Gönderiler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("reposts")}
            className={`flex-1 pb-3 text-sm font-medium uppercase tracking-wider transition-colors ${activeTab === "reposts" ? "border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Koleksiyon</span>
            </div>
          </button>
        </div>

        {/* Posts Grid */}
        <div className="columns-2 md:columns-3 gap-1 space-y-1">
          {currentPosts.map((post, index) => (
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
              {activeTab === "reposts" && (
                <div className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full">
                  <RotateCcw className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>

        {currentPosts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <p>
              {activeTab === "posts"
                ? "Henüz hiç gönderi yok"
                : "Henüz hiç yeniden paylaşım yok"}
            </p>
          </div>
        )}
      </main>

      {/* Post Detail Modal */}
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
            {selectedPostIndex < currentPosts.length - 1 && (
              <button
                onClick={() => navigatePost("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Modal Footer */}
          <div className="fixed md:relative bottom-16 md:bottom-0 left-0 right-0 bg-background border-t border-border z-10 flex-shrink-0">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                  {profile.avatar_url ? (
                    <VscoImage
                      src={profile.avatar_url}
                      alt=""
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground bg-muted">
                      {profile.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile.username}</p>
                  {profile.member_badge && (
                    <p className="text-xs text-muted-foreground uppercase">{profile.member_badge}</p>
                  )}
                  {selectedPost.caption && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedPost.caption}</p>
                  )}
                </div>
              </div>

              {currentUserId && profile.id !== currentUserId && (
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

      <MobileTabBar currentUserId={currentUserId} username={currentUsername} />
    </div>
  )
}
