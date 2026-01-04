"use client"

import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { useEffect, useState } from "react"
import { databases, APPWRITE_CONFIG, Query, ID } from "@/lib/appwrite/client"
import { useAuth } from "@/lib/auth-context"

import { VscoImage } from "@/components/vsco-image"
import { getOptimizedImageUrl } from "@/lib/appwrite/utils"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { X, Heart, RotateCcw, Trash2 } from "lucide-react"

export function LandingPage() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { user } = useAuth()

  // Check like/repost status when modal opens
  useEffect(() => {
    const checkStatus = async () => {
      if (!selectedPost || !user) return
      try {
        const likesRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.LIKES,
          [Query.equal("user_id", user.$id), Query.equal("post_id", selectedPost.id)]
        )
        setIsLiked(likesRes.documents.length > 0)

        const repostsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
          [Query.equal("user_id", user.$id), Query.equal("post_id", selectedPost.id)]
        )
        setIsReposted(repostsRes.documents.length > 0)
      } catch (e) {
        console.error("Status check error:", e)
      }
    }
    checkStatus()
  }, [selectedPost, user])

  const handleLike = async () => {
    if (!user || !selectedPost || actionLoading) return
    setActionLoading(true)
    try {
      if (isLiked) {
        // Unlike
        const likesRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.LIKES,
          [Query.equal("user_id", user.$id), Query.equal("post_id", selectedPost.id)]
        )
        if (likesRes.documents.length > 0) {
          await databases.deleteDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.LIKES,
            likesRes.documents[0].$id
          )
        }
        setIsLiked(false)
      } else {
        // Like
        await databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.LIKES,
          ID.unique(),
          { user_id: user.$id, post_id: selectedPost.id, created_at: new Date().toISOString() }
        )
        setIsLiked(true)
      }
    } catch (e) {
      console.error("Like error:", e)
    }
    setActionLoading(false)
  }

  const handleRepost = async () => {
    if (!user || !selectedPost || actionLoading) return
    setActionLoading(true)
    try {
      if (isReposted) {
        // Un-repost
        const repostsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
          [Query.equal("user_id", user.$id), Query.equal("post_id", selectedPost.id)]
        )
        if (repostsRes.documents.length > 0) {
          await databases.deleteDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
            repostsRes.documents[0].$id
          )
        }
        setIsReposted(false)
      } else {
        // Repost
        await databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
          ID.unique(),
          { user_id: user.$id, post_id: selectedPost.id, original_user_id: selectedPost.user_id, created_at: new Date().toISOString() }
        )
        setIsReposted(true)
      }
    } catch (e) {
      console.error("Repost error:", e)
    }
    setActionLoading(false)
  }

  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        // Fetch more posts and shuffle for true randomness
        let postsRes;
        try {
          postsRes = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.POSTS,
            [
              Query.limit(100) // Fetch many, will shuffle and take 8
            ]
          )
        } catch (error) {
          console.warn("Error fetching posts:", error);
          return
        }

        if (postsRes.documents.length > 0) {
          // Shuffle and take 8 random posts
          const shuffled = postsRes.documents
            .sort(() => Math.random() - 0.5)
            .slice(0, 8)

          // Unique users
          const userIds = [...new Set(shuffled.map(p => p.user_id))]

          let profilesData: Record<string, any> = {}
          if (userIds.length > 0) {
            const profilesRes = await databases.listDocuments(
              APPWRITE_CONFIG.DATABASE_ID,
              APPWRITE_CONFIG.COLLECTIONS.PROFILES,
              [Query.equal("$id", userIds)]
            )
            profilesData = profilesRes.documents.reduce((acc, p) => ({ ...acc, [p.$id]: p }), {})
          }

          const postsWithProfiles = shuffled.map(post => ({
            id: post.$id, // Map Appwrite $id to id
            image_url: post.image_url,
            aspect_ratio: post.aspect_ratio,
            caption: post.caption,
            user_id: post.user_id,
            profiles: profilesData[post.user_id] ? {
              username: profilesData[post.user_id].username,
              avatar_url: profilesData[post.user_id].avatar_url
            } : null
          }))
          setFeaturedPosts(postsWithProfiles)
        }
      } catch (error) {
        console.error("Featured posts error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFeaturedPosts()
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold tracking-wide">vscotr</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/akis" className="text-sm bg-foreground text-background px-4 py-2 rounded-sm hover:opacity-90 transition-opacity">
                Akışa Git
              </Link>
            ) : (
              <>
                <Link href="/giris" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="text-sm bg-foreground text-background px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl">
          <VscoLogo className="w-20 h-20 mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-light mb-4">VSCO TR</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Fotoğraflarını paylaş, keşfet ve yaratıcı topluluğa katıl. Tamamen ücretsiz VSCO alternatifi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                href="/akis"
                className="bg-foreground text-background px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Akışa Git
              </Link>
            ) : (
              <Link
                href="/kayit"
                className="bg-foreground text-background px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Hemen Başla
              </Link>
            )}
            <Link
              href="/kesfet"
              className="border border-border px-8 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Keşfet
            </Link>
          </div>
        </div>
      </main>

      {/* Featured Grid - Real posts from database */}
      <section className="px-4 pb-24 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground mb-8">
            Topluluktan
          </h2>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse break-inside-avoid" />
              ))
              : featuredPosts.length > 0
                ? featuredPosts.map((post) => (
                  <div key={post.id} className="relative group break-inside-avoid overflow-hidden">
                    <div
                      className="relative cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      <VscoImage
                        src={post.image_url || "/placeholder.svg"}
                        alt={post.caption || "Community photo"}
                        aspectRatio={post.aspect_ratio || 1}
                        className="w-full"
                        width={400} // Optimize for landing grid
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* User Link Overlay - Clickable */}
                    <Link
                      href={`/${post.profiles?.username}`}
                      className="absolute bottom-2 left-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                        <img
                          src={getOptimizedImageUrl(post.profiles?.avatar_url, { width: 100, output: 'webp' }) || "/placeholder.svg"}
                          alt={post.profiles?.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-white text-xs font-medium drop-shadow-md">{post.profiles?.username}</span>
                    </Link>
                  </div>
                ))
                : Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-xs break-inside-avoid">
                    Görsel yok
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 VSCO TR. Tüm hakları saklıdır. Özgür Güler tarafından geliştirildi.</p>
          <div className="flex gap-6">
            <Link href="/hakkinda" className="hover:text-foreground transition-colors">
              Hakkında
            </Link>
            <Link href="/gizlilik" className="hover:text-foreground transition-colors">
              Gizlilik
            </Link>
            <Link href="/sartlar" className="hover:text-foreground transition-colors">
              Şartlar
            </Link>
          </div>
        </div>
      </footer>

      {/* Selected Post Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={getOptimizedImageUrl(selectedPost.image_url, { width: 400, output: 'webp' }) || "/placeholder.svg"}
                alt={selectedPost.caption || ""}
                className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
              />
            </div>

            {/* Post Details / User Info in Modal */}
            <div className="absolute bottom-[-3rem] left-0 right-0 flex items-center justify-between text-white">
              <Link href={`/${selectedPost.profiles?.username}`} className="flex items-center gap-2 hover:opacity-80">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                  <img
                    src={getOptimizedImageUrl(selectedPost.profiles?.avatar_url, { width: 100, output: 'webp' }) || "/placeholder.svg"}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-medium text-lg">{selectedPost.profiles?.username}</span>
              </Link>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {user && user.$id === selectedPost.user_id ? (
                  <button
                    onClick={async () => {
                      if (!confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) return
                      try {
                        await databases.deleteDocument(
                          APPWRITE_CONFIG.DATABASE_ID,
                          APPWRITE_CONFIG.COLLECTIONS.POSTS,
                          selectedPost.id
                        )
                        setSelectedPost(null)
                        window.location.reload()
                      } catch (e) {
                        console.error("Delete error", e)
                        alert("Silinirken hata oluştu")
                      }
                    }}
                    className="p-2 hover:bg-red-500/30 rounded-full transition-colors text-red-400"
                    title="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : user ? (
                  <>
                    <button
                      onClick={handleLike}
                      disabled={actionLoading}
                      className={`p-2 hover:bg-white/20 rounded-full transition-colors ${isLiked ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={handleRepost}
                      disabled={actionLoading}
                      className={`p-2 hover:bg-white/20 rounded-full transition-colors ${isReposted ? 'text-green-500' : ''}`}
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Bar */}
      {user && <MobileTabBar currentUserId={user.$id} />}
    </div>
  )
}
