"use client"

import { useState, useEffect } from "react"
import { Search, Menu, X, Share2, Grid, RotateCcw, ChevronLeft, ChevronRight, Heart, MapPin, Shuffle, Filter, Plus, Trash2, Link2 } from "lucide-react"
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
    location?: string | null
    grid_sort?: string | null
    grid_filter?: string | null
}

interface Post {
    id: string
    $id?: string
    image_url: string
    caption: string | null
    aspect_ratio: number
    created_at: string
    user_id?: string // original post owner id
    // Repost-specific fields
    isRepost?: boolean
    repost_id?: string // the repost document id (for removing repost)
    original_owner?: {
        id: string
        username: string
        avatar_url?: string | null
    }
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
    isOwnProfile: _isOwnProfileProp, // Renamed to avoid conflict - we calculate client-side
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

    // Client-side ownership check - this is the source of truth
    const isOwnProfile = currentUserId ? currentUserId === profile.id : false

    // States
    const [posts, setPosts] = useState(initialPosts)
    const [activeTab, setActiveTab] = useState<"posts" | "reposts">("posts")

    // Sort & Filter States - Load from profile (database)
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "shuffle">(() => {
        const saved = profile.grid_sort
        if (saved === 'newest' || saved === 'oldest' || saved === 'shuffle') return saved
        return "newest"
    })
    const [filterType, setFilterType] = useState<"default" | "dark" | "light" | "soft">(() => {
        const saved = profile.grid_filter
        if (saved === 'default' || saved === 'dark' || saved === 'light' || saved === 'soft') return saved
        return "default"
    })
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [showFilterMenu, setShowFilterMenu] = useState(false)

    // Save to database when changed (only for own profile)
    useEffect(() => {
        if (isOwnProfile && sortOrder !== (profile.grid_sort || 'newest')) {
            databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                profile.id,
                { grid_sort: sortOrder }
            ).catch(err => console.error('Failed to save grid_sort:', err))
        }
    }, [sortOrder, profile.id, isOwnProfile, profile.grid_sort])

    useEffect(() => {
        if (isOwnProfile && filterType !== (profile.grid_filter || 'default')) {
            databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                profile.id,
                { grid_filter: filterType }
            ).catch(err => console.error('Failed to save grid_filter:', err))
        }
    }, [filterType, profile.id, isOwnProfile, profile.grid_filter])

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

    // Filter Style - Harmonizing filters that make all images look similar
    const getFilterStyle = () => {
        switch (filterType) {
            case 'dark': return 'grayscale(0.3) brightness(0.85) contrast(1.15)' // Moody dark look
            case 'light': return 'grayscale(0.2) brightness(1.15) saturate(0.8)' // Washed out light look
            case 'soft': return 'sepia(0.25) saturate(0.85) contrast(0.95)' // Vintage soft look
            default: return 'none'
        }
    }

    // Handle Sort Change - close filter menu too
    const handleSortChange = (type: "newest" | "oldest" | "shuffle") => {
        setSortOrder(type)
        setShowSortMenu(false)
        setShowFilterMenu(false)
    }

    // Handle Filter Change - close sort menu too
    const handleFilterChange = (type: "default" | "dark" | "light" | "soft") => {
        setFilterType(type)
        setShowFilterMenu(false)
        setShowSortMenu(false)
    }

    // Close all menus
    const closeAllMenus = () => {
        setShowSortMenu(false)
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

                    // Get unique owner IDs from posts
                    const ownerIds = [...new Set(relatedPostsRes.documents.map(p => p.user_id))]
                    let ownersMap: Record<string, any> = {}

                    if (ownerIds.length > 0) {
                        const ownersRes = await databases.listDocuments(
                            APPWRITE_CONFIG.DATABASE_ID,
                            APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                            [Query.equal("$id", ownerIds)]
                        )
                        ownersMap = ownersRes.documents.reduce((acc, p) => ({ ...acc, [p.$id]: p }), {})
                    }

                    // Create repost-to-post mapping for repost_id
                    const repostToPostMap = repostsResponse.documents.reduce((acc, r) => ({
                        ...acc,
                        [r.post_id]: r.$id
                    }), {} as Record<string, string>)

                    const formattedReposts: Post[] = relatedPostsRes.documents.map(doc => ({
                        id: doc.$id,
                        image_url: doc.image_url,
                        caption: doc.caption,
                        aspect_ratio: doc.aspect_ratio || 1,
                        created_at: doc.created_at || doc.$createdAt,
                        user_id: doc.user_id,
                        isRepost: true,
                        repost_id: repostToPostMap[doc.$id],
                        original_owner: ownersMap[doc.user_id] ? {
                            id: ownersMap[doc.user_id].$id,
                            username: ownersMap[doc.user_id].username,
                            avatar_url: ownersMap[doc.user_id].avatar_url
                        } : undefined
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
                        <span className="font-semibold">VSCO TR 10</span>
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
                        {profile.bio && <p className="text-muted-foreground mb-2">{profile.bio}</p>}

                        {/* Location */}
                        {profile.location && (
                            <p className="text-muted-foreground text-sm mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {profile.location}
                            </p>
                        )}

                        {/* Links */}
                        {links && links.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-4">
                                {links.map(link => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                    >
                                        <Link2 className="w-3 h-3" />
                                        {link.label || link.url}
                                    </a>
                                ))}
                            </div>
                        )}

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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={async () => {
                                            const shareData = {
                                                title: `${profile.username} - VSCO TR`,
                                                text: profile.bio || `${profile.username} profilini incele`,
                                                url: window.location.href
                                            }
                                            try {
                                                if (navigator.share) {
                                                    await navigator.share(shareData)
                                                } else {
                                                    await navigator.clipboard.writeText(window.location.href)
                                                    alert('Profil linki kopyalandı!')
                                                }
                                            } catch (e) {
                                                console.error('Share error:', e)
                                            }
                                        }}
                                    >
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
                            <div className="w-full flex flex-wrap items-center gap-2 mt-4 pb-2 border-b border-gray-100">
                                {/* Sort Button */}
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs flex gap-1 h-7 px-2 text-muted-foreground"
                                        onClick={() => { setShowFilterMenu(false); setShowSortMenu(!showSortMenu) }}
                                    >
                                        <Shuffle className="w-3 h-3" />
                                        <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Yeni' : sortOrder === 'oldest' ? 'Eski' : 'Karışık'}</span>
                                    </Button>
                                    {showSortMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={closeAllMenus} />
                                            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl z-20 min-w-[140px] py-2 flex flex-col overflow-hidden">
                                                <button onClick={() => handleSortChange('newest')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${sortOrder === 'newest' ? 'bg-gray-100 font-medium' : ''}`}>En Yeni</button>
                                                <button onClick={() => handleSortChange('oldest')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${sortOrder === 'oldest' ? 'bg-gray-100 font-medium' : ''}`}>En Eski</button>
                                                <button onClick={() => handleSortChange('shuffle')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${sortOrder === 'shuffle' ? 'bg-gray-100 font-medium' : ''}`}>Karıştır</button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Filter Button */}
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs flex gap-1 h-7 px-2 text-muted-foreground"
                                        onClick={() => { setShowSortMenu(false); setShowFilterMenu(!showFilterMenu) }}
                                    >
                                        <Filter className="w-3 h-3" />
                                        <span className="hidden sm:inline">Ton</span>
                                    </Button>
                                    {showFilterMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={closeAllMenus} />
                                            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl z-20 min-w-[140px] py-2 flex flex-col overflow-hidden">
                                                <button onClick={() => handleFilterChange('default')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${filterType === 'default' ? 'bg-gray-100 font-medium' : ''}`}>Normal</button>
                                                <button onClick={() => handleFilterChange('dark')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${filterType === 'dark' ? 'bg-gray-100 font-medium' : ''}`}>Koyu Ton</button>
                                                <button onClick={() => handleFilterChange('light')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${filterType === 'light' ? 'bg-gray-100 font-medium' : ''}`}>Açık Ton</button>
                                                <button onClick={() => handleFilterChange('soft')} className={`text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors ${filterType === 'soft' ? 'bg-gray-100 font-medium' : ''}`}>Vintage</button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex-1" />

                                <Link href="/olustur">
                                    <Button size="sm" className="h-7 text-xs px-2 bg-foreground text-background hover:bg-foreground/90">
                                        <Plus className="w-3 h-3" />
                                        <span className="hidden sm:inline ml-1">Yeni</span>
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
                            <div style={{ filter: getFilterStyle() }}>
                                <VscoImage
                                    src={post.image_url || "/placeholder.svg"}
                                    alt={post.caption || ""}
                                    aspectRatio={post.aspect_ratio || 1}
                                    className="w-full h-full"
                                />
                            </div>
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
                            {/* Show original owner for reposts, profile for own posts */}
                            {selectedPost.isRepost && selectedPost.original_owner ? (
                                <Link href={`/${selectedPost.original_owner.username}`} className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                                        {selectedPost.original_owner.avatar_url ? (
                                            <img
                                                src={selectedPost.original_owner.avatar_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground bg-muted">
                                                {selectedPost.original_owner.username[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{selectedPost.original_owner.username}</p>
                                        <p className="text-xs text-muted-foreground">Repostladın</p>
                                        {selectedPost.caption && (
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedPost.caption}</p>
                                        )}
                                    </div>
                                </Link>
                            ) : (
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
                            )}

                            {/* Action buttons based on post type */}
                            {isOwnProfile && selectedPost.isRepost && selectedPost.repost_id ? (
                                // Repost: show "remove repost" button (deletes from reposts table, not posts)
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Bu repostu kaldırmak istediğinizden emin misiniz?")) return
                                            try {
                                                await databases.deleteDocument(
                                                    APPWRITE_CONFIG.DATABASE_ID,
                                                    APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
                                                    selectedPost.repost_id!
                                                )
                                                setSelectedPostIndex(null)
                                                window.location.reload()
                                            } catch (e) {
                                                console.error("Remove repost error", e)
                                                alert("Repost kaldırılırken hata oluştu")
                                            }
                                        }}
                                        className="p-2 hover:bg-orange-100 rounded-full transition-colors text-orange-500"
                                        title="Repostu Kaldır"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : isOwnProfile ? (
                                // Own post: show delete button
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
                            ) : (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleLike(selectedPost.id)}
                                        className={`p-2 hover:bg-accent rounded-full transition-colors ${postStates[selectedPost.id]?.liked ? "text-red-500" : ""}`}
                                    >
                                        <Heart className={`w-5 h-5 ${postStates[selectedPost.id]?.liked ? "fill-current" : ""}`} />
                                    </button>
                                    <button
                                        onClick={() => handleRepost(selectedPost.id)}
                                        className={`p-2 hover:bg-accent rounded-full transition-colors ${postStates[selectedPost.id]?.reposted ? "text-green-500" : ""}`}
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            <MobileTabBar currentUserId={currentUserId} username={currentUsername} />
        </div >
    )
}
