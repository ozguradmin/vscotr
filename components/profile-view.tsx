"use client"

import { useState, useEffect } from "react"
import { Search, Menu, X, Share2, Grid, RotateCcw, ChevronLeft, ChevronRight, Heart, MapPin, Shuffle, Filter, Plus } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { SettingsModal } from "@/components/settings-modal"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { VscoImage } from "@/components/vsco-image"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ID, Query } from "appwrite"

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
    $id?: string
    image_url: string
    caption: string | null
    aspect_ratio: number
    created_at: string
}

interface Repost {
    id: string
    $id?: string
    profile_id: string
    post_id: string
    created_at: string
    posts: Post // Expanded relation
}

interface ProfileViewProps {
    profile: Profile
    isOwnProfile: boolean
    posts: Post[]
    reposts: Repost[]
    links: { id: string; label: string; url: string }[]
}

export function ProfileView({
    profile,
    posts: initialPosts,
    reposts,
    isOwnProfile,
    links
}: {
    profile: Profile
    posts: Post[]
    reposts: Repost[]
    isOwnProfile: boolean
    links: { id: string; label: string; url: string }[]
}) {
    const { user } = useAuth()
    const currentUserId = user?.$id
    const currentUsername = user?.name
    const router = useRouter()

    // States
    const [posts, setPosts] = useState(initialPosts)
    const [activeTab, setActiveTab] = useState<"posts" | "reposts">("posts")

    // Sort & Filter States
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "shuffle">("newest")
    const [filterType, setFilterType] = useState<"default" | "dark" | "light" | "soft">("default")
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [showFilterMenu, setShowFilterMenu] = useState(false)

    // Followers States
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followersList, setFollowersList] = useState<any[]>([])
    const [followingList, setFollowingList] = useState<any[]>([])

    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [editProfileOpen, setEditProfileOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
    const [isFollowing, setIsFollowing] = useState(false)
    const [postStates, setPostStates] = useState<Record<string, { liked: boolean; reposted: boolean }>>({})
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // Client-side post fetching logic
    const [clientPosts, setClientPosts] = useState<Post[]>([])
    const [clientReposts, setClientReposts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingReposts, setIsLoadingReposts] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const currentPosts = activeTab === "posts" ? clientPosts : clientReposts

    // Filter Style
    const getFilterStyle = () => {
        switch (filterType) {
            case 'dark': return 'brightness(0.8) contrast(1.1) saturate(0.9)'
            case 'light': return 'brightness(1.1) contrast(0.95) saturate(0.9)'
            case 'soft': return 'brightness(1.05) contrast(0.9) sepia(0.1)'
            default: return 'none'
        }
    }

    // Handle Sort Change
    const handleSortChange = (type: "newest" | "oldest" | "shuffle") => {
        setSortOrder(type)
        setShowSortMenu(false)
    }

    // Handle Filter Change
    const handleFilterChange = (type: "default" | "dark" | "light" | "soft") => {
        setFilterType(type)
        setShowFilterMenu(false)
    }

    useEffect(() => {
        window.scrollTo(0, 0)
        checkFollowStatus()
        fetchFollowCounts()
    }, [currentUserId, profile.id])

    // Fetching effect (Appwrite)
    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true)
            setIsLoadingReposts(true)
            setFetchError(null)
            try {
                // 1. Fetch Posts
                let queries = [
                    Query.equal("user_id", profile.id),
                    Query.limit(50)
                ];

                if (sortOrder === 'newest') queries.push(Query.orderDesc("created_at"));
                else if (sortOrder === 'oldest') queries.push(Query.orderAsc("created_at"));
                // Shuffle handled client side or separate logic normally, assuming simple here

                const postsResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.POSTS,
                    queries
                )

                let formattedPosts: Post[] = postsResponse.documents.map((doc) => ({
                    id: doc.$id,
                    image_url: doc.image_url,
                    caption: doc.caption,
                    aspect_ratio: doc.aspect_ratio || 1,
                    created_at: doc.created_at || doc.$createdAt
                }))

                if (sortOrder === 'shuffle') {
                    formattedPosts = formattedPosts.sort(() => Math.random() - 0.5);
                }

                setClientPosts(formattedPosts)
                setIsLoading(false)

                // 2. Fetch Reposts
                const repostsResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                    [
                        Query.equal("user_id", profile.id),
                        Query.limit(50)
                    ]
                )

                if (repostsResponse.documents.length > 0) {
                    const postIds = repostsResponse.documents.map(d => d.post_id)
                    const relatedPostsRes = await databases.listDocuments(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTIONS.POSTS,
                        [Query.equal("$id", postIds)]
                    )

                    const formattedReposts: Post[] = relatedPostsRes.documents.map(doc => ({
                        id: doc.$id,
                        image_url: doc.image_url,
                        caption: doc.caption,
                        aspect_ratio: doc.aspect_ratio || 1,
                        created_at: doc.created_at || doc.$createdAt
                    }))
                    setClientReposts(formattedReposts)
                } else {
                    setClientReposts([])
                }

            } catch (err: any) {
                console.error("[Profile] Fetch error:", err)
                setFetchError("Veriler yüklenirken hata.")
            } finally {
                setIsLoading(false)
                setIsLoadingReposts(false)
            }
        }

        fetchProfileData()
    }, [profile.id, sortOrder])

    // Load Post States
    useEffect(() => {
        if (!currentUserId || currentPosts.length === 0) return

        const checkStates = async () => {
            const postIds = currentPosts.map(p => p.id)
            if (postIds.length === 0) return

            try {
                const likesRes = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.LIKES,
                    [
                        Query.equal("user_id", currentUserId),
                        Query.equal("post_id", postIds)
                    ]
                )
                const repostsRes = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                    [
                        Query.equal("user_id", currentUserId),
                        Query.equal("post_id", postIds)
                    ]
                )

                const likedIds = new Set(likesRes.documents.map(d => d.post_id))
                const repostedIds = new Set(repostsRes.documents.map(d => d.post_id))

                const newStates: Record<string, { liked: boolean; reposted: boolean }> = {}
                currentPosts.forEach(post => {
                    newStates[post.id] = {
                        liked: likedIds.has(post.id),
                        reposted: repostedIds.has(post.id)
                    }
                })
                setPostStates(prev => ({ ...prev, ...newStates }))
            } catch (e) {
                console.error("State check error", e)
            }
        }

        checkStates()
    }, [currentUserId, currentPosts, activeTab])

    const fetchFollowCounts = async () => {
        try {
            const followersRes = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                [Query.equal("following_id", profile.id)]
            )
            setFollowersCount(followersRes.total)

            const followingRes = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                [Query.equal("follower_id", profile.id)]
            )
            setFollowingCount(followingRes.total)
        } catch (e) {
            console.error("Fetch counts error", e)
        }
    }

    const checkFollowStatus = async () => {
        if (!currentUserId) return
        try {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                [
                    Query.equal("follower_id", currentUserId),
                    Query.equal("following_id", profile.id)
                ]
            )
            setIsFollowing(res.total > 0)
        } catch (e) {
            console.error("Follow check error", e)
        }
    }

    const handleFollow = async () => {
        if (!currentUserId) {
            router.push("/giris")
            return
        }

        if (isFollowing) {
            const res = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                [
                    Query.equal("follower_id", currentUserId),
                    Query.equal("following_id", profile.id)
                ]
            )
            if (res.documents.length > 0) {
                await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.FOLLOWS, res.documents[0].$id)
                setIsFollowing(false)
                setFollowersCount(prev => Math.max(0, prev - 1))
            }
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                ID.unique(),
                { follower_id: currentUserId, following_id: profile.id }
            )
            setIsFollowing(true)
            setFollowersCount(prev => prev + 1)
        }
    }

    const handleLike = async (postId: string) => {
        if (!currentUserId) return router.push("/giris")
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
            setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], liked: false } }))
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.LIKES,
                ID.unique(),
                { user_id: currentUserId, post_id: postId }
            )
            setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], liked: true } }))
        }
    }

    const handleRepost = async (postId: string) => {
        if (!currentUserId) return router.push("/giris")
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
            setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], reposted: false } }))
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                ID.unique(),
                { user_id: currentUserId, post_id: postId }
            )
            setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], reposted: true } }))
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
                        <span className="font-semibold">VSCO TR 9</span>
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
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden relative border border-border">
                            {profile.avatar_url ? (
                                <VscoImage
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground bg-muted">
                                    {profile.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-2xl font-bold">{profile.username}</h1>
                            {profile.member_badge && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full uppercase font-semibold">
                                    {profile.member_badge}
                                </span>
                            )}
                        </div>
                        {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}

                        {currentUserId && profile.id !== currentUserId && (
                            <Button onClick={handleFollow} className="w-full md:w-auto">
                                {isFollowing ? "Takibi Bırak" : "Takip Et"}
                            </Button>
                        )}

                        {isOwnProfile && (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-3">
                                    <Button variant="outline" size="sm" onClick={() => router.push('/ayarlar')} className="h-8 border-black text-black hover:bg-black hover:text-white transition-colors">
                                        Profili Düzenle
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                    <button onClick={() => setShowFollowersModal(true)} className="hover:text-foreground hover:underline">
                                        <span className="font-bold text-foreground">{followersCount}</span> takipçi
                                    </button>
                                    <button onClick={() => setShowFollowingModal(true)} className="hover:text-foreground hover:underline">
                                        <span className="font-bold text-foreground">{followingCount}</span> takip
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Toolbar: Sort, Filter, Create (Only Own Profile) */}
                        {isOwnProfile && activeTab === "posts" && (
                            <div className="w-full max-w-2xl flex items-center justify-between mt-4 pb-2 border-b border-gray-100">
                                <div className="flex gap-2 relative">
                                    {/* Sort Button */}
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs flex gap-1 h-7 text-muted-foreground"
                                            onClick={() => setShowSortMenu(!showSortMenu)}
                                        >
                                            <Shuffle className="w-3 h-3" />
                                            {sortOrder === 'newest' ? 'Yeni' : sortOrder === 'oldest' ? 'Eski' : 'Karışık'}
                                        </Button>
                                        {showSortMenu && (
                                            <div className="absolute top-full left-0 mt-1 bg-background border rounded shadow-lg z-20 min-w-[120px] py-1 flex flex-col">
                                                <button onClick={() => handleSortChange('newest')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">En Yeni</button>
                                                <button onClick={() => handleSortChange('oldest')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">En Eski</button>
                                                <button onClick={() => handleSortChange('shuffle')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">Karıştır</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Filter Button */}
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs flex gap-1 h-7 text-muted-foreground"
                                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        >
                                            <Filter className="w-3 h-3" />
                                            Ton: {filterType === 'default' ? 'Normal' : filterType === 'dark' ? 'Koyu' : filterType === 'light' ? 'Açık' : 'Soft'}
                                        </Button>
                                        {showFilterMenu && (
                                            <div className="absolute top-full left-0 mt-1 bg-background border rounded shadow-lg z-20 min-w-[120px] py-1 flex flex-col">
                                                <button onClick={() => handleFilterChange('default')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">Varsayılan</button>
                                                <button onClick={() => handleFilterChange('dark')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">Koyu Ton</button>
                                                <button onClick={() => handleFilterChange('light')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">Açık Ton</button>
                                                <button onClick={() => handleFilterChange('soft')} className="text-left px-3 py-1.5 hover:bg-accent text-xs">Soft</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link href="/olustur">
                                    <Button size="sm" className="h-7 text-xs bg-foreground text-background hover:bg-foreground/90">
                                        <Plus className="w-3 h-3 mr-1" />
                                        Yeni Post
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

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
                            <span>Repostlar</span>
                        </div>
                    </button>
                </div>

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

                {
                    (activeTab === "posts" ? isLoading : isLoadingReposts) ? (
                        <div className="columns-2 md:columns-3 gap-1 space-y-1">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="aspect-square bg-muted animate-pulse break-inside-avoid" />
                            ))}
                        </div>
                    ) : currentPosts.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            {fetchError ? (
                                <div className="text-red-500">
                                    <p>{fetchError}</p>
                                    <button onClick={() => window.location.reload()} className="mt-2 text-xs underline">Tekrar Dene</button>
                                </div>
                            ) : (
                                <p>
                                    {activeTab === "posts"
                                        ? "Henüz hiç gönderi yok"
                                        : "Henüz hiç yeniden paylaşım yok"}
                                </p>
                            )}
                        </div>
                    ) : null
                }
            </main >

            {/* Full Screen Post Modal */}
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
                            {/* Native img for reliability */}
                            <img
                                src={selectedPost.image_url || "/placeholder.svg"}
                                alt={selectedPost.caption || ""}
                                className="max-w-full max-h-full object-contain"
                                style={{ filter: getFilterStyle() }}
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
                                {/* Go to Detail Page Button */}
                                <Link href={`/p/${selectedPost.id}`}>
                                    <Button size="icon" variant="ghost" className="rounded-full">
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            <MobileTabBar currentUserId={currentUserId} username={currentUsername} />
        </div >
    )
}
