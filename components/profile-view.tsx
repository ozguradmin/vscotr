"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Menu,
  X,
  MapPin,
  LinkIcon,
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCcw,
  Plus,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  member_badge: string | null
  location: string | null
}

interface Post {
  id: string
  image_url: string
  caption: string | null
  post_date: string | null
  aspect_ratio: number
  order_index: number
  user_id: string
  likes_count?: number
  reposts_count?: number
  is_liked?: boolean
  is_reposted?: boolean
}

interface ProfileLink {
  id: string
  label: string | null
  url: string
}

interface Repost {
  id: string
  posts: Post & { profiles?: Profile }
  created_at: string
}

interface ProfileViewProps {
  profile: Profile
  posts: Post[]
  links: ProfileLink[]
  reposts: Repost[]
  currentUserId?: string
  isFollowing: boolean
  isOwnProfile: boolean
}

export function ProfileView({
  profile,
  posts,
  links,
  reposts,
  currentUserId,
  isFollowing: initialIsFollowing,
  isOwnProfile,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "reposts">("recent")
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followLoading, setFollowLoading] = useState(false)
  const [postStates, setPostStates] = useState<
    Record<string, { liked: boolean; reposted: boolean; likesCount: number }>
  >({})
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  // Post durumlarını yükle
  useEffect(() => {
    if (currentUserId && posts.length > 0) {
      loadPostStates()
    }
  }, [currentUserId, posts])

  const loadPostStates = async () => {
    const postIds = posts.map((p) => p.id)

    // Beğenileri al
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId!)
      .in("post_id", postIds)

    // Repostları al
    const { data: userReposts } = await supabase
      .from("reposts")
      .select("post_id")
      .eq("user_id", currentUserId!)
      .in("post_id", postIds)

    // Beğeni sayılarını al
    const { data: likeCounts } = await supabase.from("likes").select("post_id").in("post_id", postIds)

    const likedPosts = new Set(likes?.map((l) => l.post_id) || [])
    const repostedPosts = new Set(userReposts?.map((r) => r.post_id) || [])
    const likeCountMap: Record<string, number> = {}
    likeCounts?.forEach((l) => {
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

  useEffect(() => {
    if (isOwnProfile) {
      loadFollowCounts()
    }
  }, [isOwnProfile])

  const loadFollowCounts = async () => {
    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id)

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id)

    setFollowersCount(followers || 0)
    setFollowingCount(following || 0)
  }

  const currentPosts = activeTab === "recent" ? posts : reposts.map((r) => r.posts)
  const selectedPost = selectedPostIndex !== null ? currentPosts[selectedPostIndex] : null

  const handleFollow = async () => {
    if (!currentUserId) {
      router.push("/giris")
      return
    }

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profile.id)
        setIsFollowing(false)
      } else {
        await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profile.id })
        setIsFollowing(true)
      }
    } catch (error) {
      console.error("Takip hatası:", error)
    } finally {
      setFollowLoading(false)
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
        [postId]: { ...prev[postId], liked: false, likesCount: prev[postId].likesCount - 1 },
      }))
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId })
      setPostStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], liked: true, likesCount: (prev[postId]?.likesCount || 0) + 1 },
      }))
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
    router.refresh()
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/${profile.username}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.username} - VSCO TR`,
          url: profileUrl,
        })
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(profileUrl)
      alert("Profil linki kopyalandı!")
    }
  }

  const handleDeletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId)
    router.refresh()
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })
  }

  const navigatePost = (direction: "prev" | "next") => {
    if (selectedPostIndex === null) return
    if (direction === "prev" && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1)
    } else if (direction === "next" && selectedPostIndex < currentPosts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1)
    }
  }

  // Klavye navigasyonu
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

  const canInteract = currentUserId && !isOwnProfile

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/">
              <VscoLogo className="w-8 h-8" />
            </Link>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              vscotr.vercel.app/ <span className="text-foreground font-medium">{profile.username}</span>
            </span>
            <span className="text-sm text-muted-foreground sm:hidden">
              <span className="text-foreground font-medium">{profile.username}</span>
            </span>
          </div>
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

      {/* Mobile Menu */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} currentUserId={currentUserId} />

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Profile Section */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0 bg-muted">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url || "/placeholder.svg"}
                alt={profile.display_name || profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                {profile.username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">{profile.username}</h1>
            {profile.member_badge && (
              <span className="inline-block px-3 py-1 bg-foreground text-background text-xs font-medium uppercase tracking-wider mb-2">
                {profile.member_badge}
              </span>
            )}
            {isOwnProfile && (
              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                <button className="hover:text-foreground">
                  <span className="font-semibold text-foreground">{followingCount}</span> Takip Edilen
                </button>
                <button className="hover:text-foreground">
                  <span className="font-semibold text-foreground">{followersCount}</span> Takipçi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && <p className="text-sm mb-4 whitespace-pre-wrap">{profile.bio}</p>}

        {/* Location & Links */}
        {(profile.location || links.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
            {profile.location && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <LinkIcon className="w-4 h-4" />
                {link.label || link.url.replace(/https?:\/\//, "").split("/")[0]}
              </a>
            ))}
          </div>
        )}

        {/* Follow Button */}
        {!isOwnProfile && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                isFollowing
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {followLoading ? "..." : isFollowing ? "TAKİP EDİLİYOR" : "TAKİP ET"}
            </button>
          </div>
        )}

        {/* Edit Profile Button for own profile */}
        {isOwnProfile && (
          <div className="mb-6 flex gap-3">
            <Link
              href="/ayarlar"
              className="inline-block px-6 py-2 text-sm font-medium border border-border hover:bg-accent transition-colors"
            >
              Profili Düzenle
            </Link>
            <button
              onClick={handleShare}
              className="p-2 border border-border hover:bg-accent transition-colors rounded"
              title="Profil linkini paylaş"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border mb-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("recent")}
              className={`pb-3 text-xs font-medium uppercase tracking-wider transition-colors relative ${
                activeTab === "recent" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Son Paylaşımlar
              {activeTab === "recent" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
            </button>
            <button
              onClick={() => setActiveTab("reposts")}
              className={`pb-3 text-xs font-medium uppercase tracking-wider transition-colors relative ${
                activeTab === "reposts" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Repostlar
              {activeTab === "reposts" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
            </button>
          </div>
        </div>

        {/* Photo Grid - Masonry style with actual aspect ratios */}
        {currentPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {isOwnProfile && activeTab === "recent" && (
              <Link
                href="/olustur"
                className="col-span-3 w-full aspect-[3/1] bg-muted hover:bg-accent transition-colors flex items-center justify-center border-2 border-dashed border-border rounded mb-1"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Yeni Gönderi</span>
                </div>
              </Link>
            )}
            <div className="col-span-3 columns-2 md:columns-3 gap-1 space-y-1">
              {currentPosts.map((post, index) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostIndex(index)}
                  className="block w-full overflow-hidden break-inside-avoid"
                >
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || ""}
                    className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                    style={{
                      aspectRatio: post.aspect_ratio || 1,
                    }}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              {activeTab === "recent" ? "Henüz paylaşım yok" : "Henüz repost yok"}
            </p>
            {isOwnProfile && activeTab === "recent" && (
              <Link href="/olustur">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Gönderi Ekle
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Post Modal */}
      {selectedPost && selectedPostIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-border">
            {isOwnProfile && activeTab === "recent" && (
              <div className="relative">
                <button onClick={() => setShowPostMenu(!showPostMenu)} className="p-2 hover:bg-accent rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showPostMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg min-w-[150px] z-50">
                    <button
                      onClick={() => {
                        router.push(`/ayarlar`)
                        setShowPostMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        setPostToDelete(selectedPost.id)
                        setDeleteConfirmOpen(true)
                        setShowPostMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1" />
            <button onClick={() => setSelectedPostIndex(null)} className="p-2 hover:bg-accent rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative">
            <img
              src={selectedPost.image_url || "/placeholder.svg"}
              alt={selectedPost.caption || ""}
              className="max-w-full max-h-[70vh] object-contain"
            />

            {selectedPostIndex > 0 && (
              <button
                onClick={() => navigatePost("prev")}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedPostIndex < currentPosts.length - 1 && (
              <button
                onClick={() => navigatePost("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 hover:bg-accent rounded-full transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Modal Footer */}
          <div className="fixed md:relative bottom-16 md:bottom-0 left-0 right-0 p-4 md:pb-4 border-t border-border bg-background z-10 mb-16 md:mb-0">
            <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{profile.username}</p>
                {selectedPost.post_date && (
                  <p className="text-sm text-primary mt-1">{formatDate(selectedPost.post_date)}</p>
                )}
                {selectedPost.caption && (
                  <p className="text-sm text-muted-foreground mt-2 break-words">{selectedPost.caption}</p>
                )}
              </div>
              {/* Like & Repost buttons */}
              {canInteract && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`p-2 hover:bg-accent rounded-full transition-colors ${
                      postStates[selectedPost.id]?.liked ? "text-red-500" : ""
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${postStates[selectedPost.id]?.liked ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => handleRepost(selectedPost.id)}
                    className={`p-2 hover:bg-accent rounded-full transition-colors ${
                      postStates[selectedPost.id]?.reposted ? "text-green-500" : ""
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

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Gönderiyi Sil</h3>
            <p className="text-sm text-muted-foreground mb-4">Bu gönderiyi silmek istediğinize emin misiniz?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="flex-1">
                İptal
              </Button>
              <Button
                onClick={() => {
                  if (postToDelete) {
                    handleDeletePost(postToDelete)
                  }
                  setDeleteConfirmOpen(false)
                  setSelectedPostIndex(null)
                }}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileTabBar currentUserId={currentUserId} username={profile.username} />
    </div>
  )
}
