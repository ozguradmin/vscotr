"use client"

import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

export function LandingPage() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const loadFeaturedPosts = async () => {
      try {
        // JOIN olmadan basit query - timeout'u önlemek için
        const { data: posts, error } = await supabase
          .from("posts")
          .select("id, image_url, aspect_ratio, caption, user_id")
          .order("created_at", { ascending: false })
          .limit(8)

        if (error) {
          console.error('[Landing] Posts error:', error)
          setIsLoading(false)
          return
        }

        if (posts && posts.length > 0) {
          // Profilleri ayrı çek
          const userIds = [...new Set(posts.map(p => p.user_id))]
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds)

          const postsWithProfiles = posts.map(post => ({
            ...post,
            profiles: profiles?.find(p => p.id === post.user_id) || null
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
            <span className="font-semibold">VSCO TR 6</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/giris" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="text-sm bg-foreground text-background px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
            >
              Kayıt Ol
            </Link>
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
            <Link
              href="/kayit"
              className="bg-foreground text-background px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Hemen Başla
            </Link>
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
                    className="aspect-square bg-muted overflow-hidden block"
                  >
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
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

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPost.image_url || "/placeholder.svg"}
              alt={selectedPost.caption || ""}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />
            {selectedPost.profiles && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
                {selectedPost.profiles.avatar_url && (
                  <img
                    src={selectedPost.profiles.avatar_url || "/placeholder.svg"}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-white text-sm font-medium">{selectedPost.profiles.username}</span>
              </div>
            )}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 backdrop-blur-sm hover:bg-black/90 rounded-full text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
