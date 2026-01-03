"use client"

import { useState, useEffect, useRef } from "react"
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

// Seeded RNG
function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
    const [shuffleSeed, setShuffleSeed] = useState<number>(0)

    // Load/Init Shuffle Seed
    useEffect(() => {
        const saved = localStorage.getItem('shuffleSeed')
        if (saved) {
            setShuffleSeed(parseInt(saved))
        } else {
            const newSeed = Date.now()
            localStorage.setItem('shuffleSeed', newSeed.toString())
            setShuffleSeed(newSeed)
        }
    }, [])

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
    const touchStart = useRef<number | null>(null)
    const touchEnd = useRef<number | null>(null)

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
        if (type === 'shuffle') {
            if (sortOrder === 'shuffle') {
                // User explicitly clicked shuffle again -> Re-shuffle
                const newSeed = Date.now()
                localStorage.setItem('shuffleSeed', newSeed.toString())
                setShuffleSeed(newSeed)
            }
        }
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
                    // Robust Shuffle: Assign random score deterministically from seed
                    const rnd = mulberry32(shuffleSeed)
                    // Map items to { item, score }
                    const scored = formattedPosts.map(p => ({ p, score: rnd() }))
                    // Sort by score
                    scored.sort((a, b) => a.score - b.score)
                    // Map back
                    formattedPosts = scored.map(s => s.p)
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
        fetchProfileData()
    }, [profile.id, sortOrder, shuffleSeed])

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

    const fetchFollowersList = async () => {
        try {
            const followsRes = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                [Query.equal("following_id", profile.id), Query.limit(50)]
            )

            if (followsRes.documents.length > 0) {
                const followerIds = followsRes.documents.map(f => f.follower_id)
                const profilesRes = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                    [Query.equal("$id", followerIds)]
                )
                setFollowersList(profilesRes.documents)
            } else {
                setFollowersList([])
            }
        } catch (e) {
            console.error("Fetch followers list error", e)
            setFollowersList([])
        }
    }

    const fetchFollowingList = async () => {
        try {
            const followsRes = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
                [Query.equal("follower_id", profile.id), Query.limit(50)]
            )

            if (followsRes.documents.length > 0) {
                const followingIds = followsRes.documents.map(f => f.following_id)
                const profilesRes = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                    [Query.equal("$id", followingIds)]
                )
                setFollowingList(profilesRes.documents)
            } else {
                setFollowingList([])
            }
        } catch (e) {
            console.error("Fetch following list error", e)
            setFollowingList([])
        }
    }

    // Open modal handlers
    const openFollowersModal = () => {
        fetchFollowersList()
        setShowFollowersModal(true)
    }

    const openFollowingModal = () => {
        fetchFollowingList()
        setShowFollowingModal(true)
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
        touchEnd.current = null
        touchStart.current = e.targetTouches[0].clientX
    }
    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX
    }
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return
        const distance = touchStart.current - touchEnd.current
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
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-200">
                <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
                    <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <VscoLogo className="w-6 h-6" />
                        <div className="flex items-center gap-2 text-sm md:text-base font-light tracking-wide">
                            <span className="font-bold">vscotr</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="truncate max-w-[120px] md:max-w-none">{profile.username}</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-accent rounded-full transition-colors" onClick={() => setSearchOpen(true)} aria-label="Arama">
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Menü"
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
            <EditProfileModal
                isOpen={editProfileOpen}
                onClose={() => setEditProfileOpen(false)}
                currentProfile={profile}
            />
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

            <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col gap-5 md:gap-6 mb-12">
                    {/* Row 1: Header (Avatar + Name) */}
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden relative bg-muted ring-1 ring-border">
                                {profile.avatar_url ? (
                                    <VscoImage
                                        src={profile.avatar_url}
                                        alt={profile.username}
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-light text-muted-foreground bg-muted">
                                        {profile.username[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{profile.username}</h1>
                            {profile.member_badge && (
                                <span className="bg-foreground text-background text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                                    {profile.member_badge}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Bio (Aligned Left) */}
                    {profile.bio && (
                        <p className="text-sm md:text-base font-light leading-relaxed max-w-lg text-foreground/90 pl-1">
                            {profile.bio}
                        </p>
                    )}

                    {/* Row 3: Location / Links */}
                    <div className="flex flex-col gap-2 pl-1">
                        {profile.location && (
                            <span className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground uppercase tracking-wide">
                                <MapPin className="w-3 h-3" />
                                {profile.location}
                            </span>
                        )}
                        {links && links.length > 0 && (
                            <div className="flex flex-wrap gap-4">
                                {links.map(link => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs md:text-sm font-medium hover:text-foreground transition-colors flex items-center gap-1 text-blue-600 dark:text-blue-400"
                                    >
                                        <Link2 className="w-3 h-3" />
                                        {link.label || "Link"}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Row 4: Actions */}
                    <div className="flex items-center gap-4 mt-2 pl-1">
                        {currentUserId && profile.id !== currentUserId && (
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleFollow}
                                    className="rounded-full uppercase tracking-widest text-xs font-bold h-10 px-8 shadow-sm hover:shadow-md transition-all"
                                    variant={isFollowing ? "outline" : "default"}
                                >
                                    {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                                </Button>
                                {/* More Button */}
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                                    <span className="sr-only">Daha fazla</span>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                </Button>
                            </div>
                        )}

                        {isOwnProfile && (
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="outline" size="sm" onClick={() => router.push('/ayarlar')} className="rounded-full px-6 text-xs uppercase tracking-wider font-medium h-9 border-foreground/20 hover:border-foreground transition-colors">
                                    Profili Düzenle
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full hover:bg-accent"
                                    onClick={async () => {
                                        const shareData = { title: `${profile.username} - VSCO TR`, url: window.location.href }
                                        try { navigator.share ? await navigator.share(shareData) : await navigator.clipboard.writeText(window.location.href) } catch { }
                                    }}
                                >
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Follow Counts - Optional placement, putting below actions as small text */}
                    <div className="flex gap-6 text-sm font-light text-muted-foreground justify-start pl-1 mt-1">
                        <button onClick={openFollowersModal} className="hover:text-foreground transition-colors">
                            <strong className="font-medium text-foreground">{followersCount}</strong> takipçi
                        </button>
                        <button onClick={openFollowingModal} className="hover:text-foreground transition-colors">
                            <strong className="font-medium text-foreground">{followingCount}</strong> takip
                        </button>
                    </div>

                    {/* Sort/Filter Toolbar (Own Profile) - Kept relative */}
                    {isOwnProfile && activeTab === "posts" && (
                        <div className="w-full flex flex-wrap items-center justify-start gap-2 mt-4 pl-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] uppercase tracking-widest h-7 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => { setShowFilterMenu(false); setShowSortMenu(!showSortMenu) }}
                            >
                                <Shuffle className="w-3 h-3 mr-1" />
                                Sıralama
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] uppercase tracking-widest h-7 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => { setShowSortMenu(false); setShowFilterMenu(!showFilterMenu) }}
                            >
                                <Filter className="w-3 h-3 mr-1" />
                                Filtre
                            </Button>
                            <Link href="/olustur">
                                <Button size="sm" className="h-7 text-[10px] uppercase tracking-widest px-3 bg-foreground text-background rounded-full">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Yeni
                                </Button>
                            </Link>
                            {(showSortMenu || showFilterMenu) && (
                                <div className="fixed inset-0 z-10" onClick={closeAllMenus} />
                            )}
                            {showSortMenu && (
                                <div className="absolute mt-8 bg-background border rounded-md shadow-lg z-20 py-1 min-w-[120px]">
                                    {['newest', 'oldest', 'shuffle'].map(o => (
                                        <button key={o} onClick={() => handleSortChange(o as any)} className="w-full text-left px-4 py-2 text-xs hover:bg-accent capitalize">{o === 'newest' ? 'Yeni' : o === 'oldest' ? 'Eski' : 'Karışık'}</button>
                                    ))}
                                </div>
                            )}
                            {showFilterMenu && (
                                <div className="absolute mt-8 ml-20 bg-background border rounded-md shadow-lg z-20 py-1 min-w-[120px]">
                                    {['default', 'dark', 'light', 'soft'].map(f => (
                                        <button key={f} onClick={() => handleFilterChange(f as any)} className="w-full text-left px-4 py-2 text-xs hover:bg-accent capitalize">{f}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-8 mb-6 border-b border-border/50">
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`pb-3 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${activeTab === "posts" ? "text-foreground border-b-2 border-foreground translate-y-[1px]" : "text-muted-foreground hover:text-foreground/80"
                            }`}
                    >
                        Gönderiler
                    </button>
                    <button
                        onClick={() => setActiveTab("reposts")}
                        className={`pb-3 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${activeTab === "reposts" ? "text-foreground border-b-2 border-foreground translate-y-[1px]" : "text-muted-foreground hover:text-foreground/80"
                            }`}
                    >
                        Repostlar
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
                                        : "Henüz hiç repost yok"}
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
            )}

            {/* Followers Modal */}
            {showFollowersModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowFollowersModal(false)}>
                    <div className="bg-background rounded-lg max-w-sm w-full mx-4 max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="font-semibold">Takipçiler</h2>
                            <button onClick={() => setShowFollowersModal(false)} className="p-1 hover:bg-accent rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] p-2">
                            {followersList.length > 0 ? (
                                followersList.map(follower => (
                                    <Link
                                        key={follower.$id}
                                        href={`/${follower.username}`}
                                        onClick={() => setShowFollowersModal(false)}
                                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                                            {follower.avatar_url ? (
                                                <img src={follower.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                                                    {follower.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium">{follower.username}</span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Henüz takipçi yok</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Following Modal */}
            {showFollowingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowFollowingModal(false)}>
                    <div className="bg-background rounded-lg max-w-sm w-full mx-4 max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="font-semibold">Takip Edilenler</h2>
                            <button onClick={() => setShowFollowingModal(false)} className="p-1 hover:bg-accent rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] p-2">
                            {followingList.length > 0 ? (
                                followingList.map(following => (
                                    <Link
                                        key={following.$id}
                                        href={`/${following.username}`}
                                        onClick={() => setShowFollowingModal(false)}
                                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                                            {following.avatar_url ? (
                                                <img src={following.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                                                    {following.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium">{following.username}</span>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Henüz kimseyi takip etmiyor</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <MobileTabBar currentUserId={currentUserId} username={currentUsername} />
        </div >
    )
}
