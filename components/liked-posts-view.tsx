"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Menu, X, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { SearchModal } from "@/components/search-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import Link from "next/link"
import { VscoImage } from "@/components/vsco-image"

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

interface LikedPostsViewProps {
  posts: Post[]
  currentUserId: string
}

export function LikedPostsView({ posts, currentUserId }: LikedPostsViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

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
  const onTouchStart = (e: React.TouchEvent) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX) }
  const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX) }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > minSwipeDistance) navigatePost("next")
    if (distance < -minSwipeDistance) navigatePost("prev")
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

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <Link href="/akis" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold tracking-wide">vscotr</span>
          </Link>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-accent rounded-full" onClick={() => setSearchOpen(true)}><Search className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-accent rounded-full" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} currentUserId={currentUserId} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-light mb-6">Beğendiğim Gönderiler</h1>
        {posts.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
            {posts.map((post, index) => (
              <button key={post.id} onClick={() => setSelectedPostIndex(index)} className="block w-full overflow-hidden break-inside-avoid relative group">
                <VscoImage src={post.image_url || "/placeholder.svg"} alt={post.caption || ""} aspectRatio={post.aspect_ratio || 1} className="w-full h-full" />
                <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><Heart className="w-3 h-3 fill-current" /></div>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground"><p>Henüz beğendiğin gönderi yok</p></div>
        )}
      </main>

      {selectedPost && selectedPostIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="flex items-center justify-end h-14 px-4 border-b border-border flex-shrink-0">
            <button onClick={() => setSelectedPostIndex(null)} className="p-2 hover:bg-accent rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 relative min-h-0">
            <img src={selectedPost.image_url || "/placeholder.svg"} alt={selectedPost.caption || ""} className="max-w-full max-h-[80vh] object-contain" />
            {selectedPostIndex > 0 && <button onClick={() => navigatePost("prev")} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 rounded-full"><ChevronLeft className="w-6 h-6" /></button>}
            {selectedPostIndex < posts.length - 1 && <button onClick={() => navigatePost("next")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-background/80 rounded-full"><ChevronRight className="w-6 h-6" /></button>}
          </div>
          <div className="fixed md:relative bottom-16 md:bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
            <Link href={`/${selectedPost.profiles.username}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                {selectedPost.profiles?.avatar_url ? <img src={selectedPost.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">{selectedPost.profiles?.username?.[0]?.toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{selectedPost.profiles.username}</p>
                {selectedPost.caption && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedPost.caption}</p>}
              </div>
            </Link>
          </div>
        </div>
      )}

      <MobileTabBar currentUserId={currentUserId} />
    </div>
  )
}
