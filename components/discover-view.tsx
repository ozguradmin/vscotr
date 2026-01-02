"use client"

import { useState, useEffect } from "react"
import { Search, Menu, X, Heart, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { VscoImage } from "@/components/vsco-image"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { useAuth } from "@/lib/auth-context"
import { ID, Query } from "appwrite"

interface Post {
    id: string
    image_url: string
    caption: string | null
    aspect_ratio: number
    created_at: string
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

export function DiscoverView({ posts: initialPosts }: DiscoverViewProps) {
    const { user: currentUser } = useAuth()
    const currentUserId = currentUser?.$id
    const currentUsername = currentUser?.name

    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)
    const [postStates, setPostStates] = useState<
        Record<string, { liked: boolean; reposted: boolean; following: boolean }>
    >({})

    const router = useRouter()

    // Client-side local state
    const [clientPosts, setClientPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const posts = initialPosts.length > 0 ? initialPosts : clientPosts

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        if (currentUserId && posts.length > 0) {
            loadPostStates()
        }
    }, [currentUserId, posts.length])

    // Fetching Logic
    useEffect(() => {
        const fetchDiscoverPosts = async () => {
            setIsLoading(true)
            setFetchError(null)
            try {
                const postsResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.POSTS,
                    [
                        Query.orderDesc("created_at"),
                        Query.limit(50)
                    ]
                )

                if (postsResponse.documents.length === 0) {
                    setClientPosts([])
                    return
                }

                const userIds = [...new Set(postsResponse.documents.map(d => d.user_id))]

                const profilesResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                    [Query.equal("$id", userIds)]
                )

                const formattedPosts: Post[] = postsResponse.documents.map(doc => {
                    const profile = profilesResponse.documents.find(p => p.$id === doc.user_id)
                    return {
                        id: doc.$id,
                        image_url: doc.image_url,
                        caption: doc.caption,
                        aspect_ratio: doc.aspect_ratio || 1,
                        created_at: doc.created_at || doc.$createdAt,
                        profiles: {
                            id: doc.user_id,
                            username: profile?.username || "unknown",
                            avatar_url: profile?.avatar_url || null,
                            member_badge: profile?.member_badge || null
                        }
                    }
                })

                setClientPosts(formattedPosts)

            } catch (err: any) {
                console.error("[Discover] Fetch error:", err)
                setFetchError("Keşfet yüklenirken hata oluştu.")
            } finally {
                setIsLoading(false)
            }
        }

        if (initialPosts.length === 0) {
            fetchDiscoverPosts()
        } else {
            setIsLoading(false)
        }
    }, [initialPosts.length])


    const loadPostStates = async () => {
        const postIds = posts.map((p) => p.id)
        const userIds = posts.map((p) => p.profiles.id)

        if (postIds.length === 0) return

        try {
            const [likesRes, repostsRes, followsRes] = await Promise.all([
                databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.LIKES,
                    [Query.equal("user_id", currentUserId!), Query.equal("post_id", postIds)]
                ),
                databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                    [Query.equal("user_id", currentUserId!), Query.equal("post_id", postIds)]
                ),
                databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                    [Query.equal("follower_id", currentUserId!), Query.equal("following_id", userIds)]
                )
            ])

            const likedPosts = new Set(likesRes.documents.map(d => d.post_id))
            const repostedPosts = new Set(repostsRes.documents.map(d => d.post_id))
            const followingUsers = new Set(followsRes.documents.map(d => d.following_id))

            const states: Record<string, { liked: boolean; reposted: boolean; following: boolean }> = {}
            posts.forEach((post) => {
                states[post.id] = {
                    liked: likedPosts.has(post.id),
                    reposted: repostedPosts.has(post.id),
                    following: followingUsers.has(post.profiles.id),
                }
            })
            setPostStates(states)
        } catch (e) {
            console.error("State load error", e)
        }
    }

    const handleLike = async (postId: string) => {
        if (!currentUserId) {
            router.push("/giris")
            return
        }

        const post = posts.find((p) => p.id === postId)
        // Kendi postunu beğenemez
        if (!post || post.profiles.id === currentUserId) return

        const currentState = postStates[postId]?.liked

        if (currentState) {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.LIKES,
                [Query.equal("user_id", currentUserId), Query.equal("post_id", postId)]
            )
            if (res.documents.length > 0) {
                await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.LIKES, res.documents[0].$id)
            }
            setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], liked: false } }))
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.LIKES,
                ID.unique(),
                { user_id: currentUserId, post_id: postId }
            )
            setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], liked: true } }))
        }
    }

    const handleRepost = async (postId: string) => {
        if (!currentUserId) {
            router.push("/giris")
            return
        }

        const post = posts.find((p) => p.id === postId)
        // Kendi postunu repostlayamaz
        if (!post || post.profiles.id === currentUserId) return

        const currentState = postStates[postId]?.reposted

        if (currentState) {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                [Query.equal("user_id", currentUserId), Query.equal("post_id", postId)]
            )
            if (res.documents.length > 0) {
                await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.REPOSTS, res.documents[0].$id)
            }
            setPostStates((prev) => ({ ...prev, [postId]: { ...prev[postId], reposted: false } }))
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                ID.unique(),
                { user_id: currentUserId, post_id: postId }
            )
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

    // Is the selected post owned by current user?
    const isOwnPost = selectedPost && currentUserId && selectedPost.profiles.id === currentUserId

    return (
        <div className="min-h-screen bg-background pb-16 md:pb-0">
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
                    <Link href="/" className="flex items-center gap-2">
                        <VscoLogo className="w-8 h-8" />
                        <span className="font-semibold">VSCO TR 9</span>
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

                {isLoading ? (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-muted animate-pulse break-inside-avoid" />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
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
                                {/* Liked/Reposted indicators */}
                                {postStates[post.id]?.liked && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                                        <Heart className="w-3 h-3 fill-current" />
                                    </div>
                                )}
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
                        {fetchError ? (
                            <div className="text-red-500">
                                <p>{fetchError}</p>
                                <button onClick={() => window.location.reload()} className="mt-2 text-xs underline">Tekrar Dene</button>
                            </div>
                        ) : (
                            <p>Henüz keşfedilecek içerik yok</p>
                        )}
                    </div>
                )}
            </main>

            {/* Full Screen Image Modal - NATIVE IMG for reliability */}
            {selectedPost && selectedPostIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-background flex flex-col"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="flex items-center justify-end h-14 px-4 border-b border-border flex-shrink-0">
                        <button onClick={() => setSelectedPostIndex(null)} className="p-2 hover:bg-accent rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative min-h-0 bg-background">
                        <div className="relative w-full h-full max-h-[80vh] flex items-center justify-center">
                            {/* Native img tag for reliable rendering */}
                            <img
                                src={selectedPost.image_url || "/placeholder.svg"}
                                alt={selectedPost.caption || ""}
                                className="max-w-full max-h-full object-contain"
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
                        <div className="p-4 flex items-start justify-between gap-4">
                            <Link
                                href={`/${selectedPost.profiles.username}`}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                                    {selectedPost.profiles.avatar_url ? (
                                        <img
                                            src={selectedPost.profiles.avatar_url || "/placeholder.svg"}
                                            alt=""
                                            className="w-full h-full object-cover"
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

                            {/* Like & Repost for others, Delete for own posts */}
                            {currentUserId && !isOwnPost && (
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
                            {currentUserId && isOwnPost && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) return
                                            try {
                                                await databases.deleteDocument(
                                                    APPWRITE_CONFIG.DATABASE_ID,
                                                    APPWRITE_CONFIG.COLLECTIONS.POSTS,
                                                    selectedPost.id
                                                )
                                                setSelectedPostIndex(null)
                                                window.location.reload()
                                            } catch (e) {
                                                console.error("Delete error", e)
                                                alert("Silinirken hata oluştu")
                                            }
                                        }}
                                        className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-500"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
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
