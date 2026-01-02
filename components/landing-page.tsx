import { useAuth } from "@/lib/auth-context"

// ... inside LandingPage component ...
const { user, currentProfile } = useAuth()
const username = currentProfile?.username || user?.name || "ozgur" // Fallback

  // ... In Header ...
  < div className = "flex items-center gap-4" >
  {
    user?(
                 <Link href = "/akis" className = "text-sm bg-foreground text-background px-4 py-2 rounded-sm hover:opacity-90 transition-opacity" >
        Akışa Git
                 </Link >
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
          </div >

  // ... In Hero Section ...
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
        import {VscoImage} from "@/components/vsco-image"

        export function LandingPage() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
        const [isLoading, setIsLoading] = useState(true)
        const [selectedPost, setSelectedPost] = useState<any | null>(null)

        const {user} = useAuth()

  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        const postsRes = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.POSTS,
        [Query.orderDesc("created_at"), Query.limit(8)]
        )

        if (postsRes.documents.length > 0) {
          // Unique users
          const userIds = [...new Set(postsRes.documents.map(p => p.user_id))]

        let profilesData: Record<string, any> = { }
          if (userIds.length > 0) {
            const profilesRes = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        [Query.equal("$id", userIds)]
        )
            profilesData = profilesRes.documents.reduce((acc, p) => ({...acc, [p.$id]: p }), { })
          }

          const postsWithProfiles = postsRes.documents.map(post => ({
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
      } catch (err) {
          console.error('[Landing] Error:', err)
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
                <span className="font-semibold">VSCO TR 7</span>
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
          <section className="px-4 pb-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground mb-8">
                Topluluktan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse" />
                  ))
                  : featuredPosts.length > 0
                    ? featuredPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="aspect-square block group"
                      >
                        <VscoImage
                          src={post.image_url || "/placeholder.svg"}
                          alt=""
                          aspectRatio={post.aspect_ratio || 1}
                          className="w-full h-full"
                        />
                      </button>
                    ))
                    : Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-xs">
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

          {
            selectedPost && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setSelectedPost(null)}
              >
                <div className="relative max-w-4xl w-full h-full flex flex-col justify-center" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-full h-[80vh]">
                    <VscoImage
                      src={selectedPost.image_url || "/placeholder.svg"}
                      alt={selectedPost.caption || ""}
                      layout="fill"
                      objectFit="contain"
                      className="bg-transparent"
                      quality={90}
                    />
                  </div>
                  {selectedPost.profiles && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg z-10">
                      {selectedPost.profiles.avatar_url && (
                        <div className="w-8 h-8 rounded-full overflow-hidden relative">
                          <VscoImage
                            src={selectedPost.profiles.avatar_url || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{selectedPost.profiles.username}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="absolute top-4 right-4 p-2 bg-black/70 backdrop-blur-sm hover:bg-black/90 rounded-full text-white z-10"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          }
        </div >
        )
}
