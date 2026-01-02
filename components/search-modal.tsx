"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { Query } from "appwrite"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { VscoImage } from "@/components/vsco-image"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }[]
  posts: {
    id: string
    image_url: string
    caption: string | null
    aspect_ratio: number
    profiles: {
      username: string
    }
  }[]
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ profiles: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults({ profiles: [], posts: [] })
    }
  }, [isOpen])

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ profiles: [], posts: [] })
        return
      }

      setLoading(true)
      try {
        // Search profiles (Username is usually string, use search or equal/startsWith if indexed)
        // Assuming 'username' is a String attribute. Query.search requires FullText. 
        // We'll try Query.startsWith or Query.search depending on index. 
        // Using Query.search for now assuming we might index it as fulltext, OR Query.startsWith which is standard for username search.
        const profilesRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.PROFILES,
          [Query.startsWith("username", debouncedQuery), Query.limit(5)]
        ).catch(() => ({ documents: [] })) // Fail safe

        // Search posts (caption)
        const postsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.POSTS,
          [Query.startsWith("caption", debouncedQuery), Query.limit(9)]
        ).catch(() => ({ documents: [] }))

        // Fetch profiles for posts
        const postUserIds = [...new Set(postsRes.documents.map(p => p.user_id))]
        let postProfiles: Record<string, any> = {}
        if (postUserIds.length > 0) {
          const profilesForPostsRes = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.PROFILES,
            [Query.equal("$id", postUserIds)]
          )
          postProfiles = profilesForPostsRes.documents.reduce((acc, p) => ({ ...acc, [p.$id]: p }), {})
        }

        const mappedPosts = postsRes.documents.map(doc => ({
          id: doc.$id,
          image_url: doc.image_url,
          caption: doc.caption,
          aspect_ratio: doc.aspect_ratio || 1,
          profiles: {
            username: postProfiles[doc.user_id]?.username || "Unknown"
          }
        }))

        const mappedProfiles = profilesRes.documents.map(doc => ({
          id: doc.$id,
          username: doc.username,
          display_name: doc.display_name,
          avatar_url: doc.avatar_url
        }))

        setResults({
          profiles: mappedProfiles,
          posts: mappedPosts,
        })
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-background">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara..."
              className="w-full pl-9 pr-4 py-2 bg-muted rounded-full focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full text-sm font-medium" aria-label="Arama İptal">
            İptal
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              {results.profiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Kullanıcılar</h3>
                  <div className="space-y-2">
                    {results.profiles.map((profile) => (
                      <Link
                        key={profile.id}
                        href={`/${profile.username}`}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
                        onClick={onClose}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden relative">
                          {profile.avatar_url ? (
                            <VscoImage
                              src={profile.avatar_url || "/placeholder.svg"}
                              alt=""
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground bg-muted">
                              {profile.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{profile.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.posts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Gönderiler</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {results.posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/${post.profiles.username}`}
                        className="block aspect-square relative group overflow-hidden bg-muted"
                        onClick={onClose}
                      >
                        <VscoImage
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.caption || ""}
                          aspectRatio={post.aspect_ratio || 1}
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!loading && query && results.profiles.length === 0 && results.posts.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Sonuç bulunamadı.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
