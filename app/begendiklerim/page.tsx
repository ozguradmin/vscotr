"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LikedPostsView } from "@/components/liked-posts-view"
import { useAuth } from "@/lib/auth-context"
import { databases, APPWRITE_CONFIG, Query } from "@/lib/appwrite/client"
import { FeedSkeleton } from "@/components/skeleton-loader"

export default function LikedPostsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/giris")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchLikedPosts() {
      if (!user) return

      try {
        const likesRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.LIKES,
          [Query.equal("user_id", user.$id), Query.orderDesc("$createdAt")]
        )

        const postIds = likesRes.documents.map(l => l.post_id)

        if (postIds.length === 0) {
          setPosts([])
          setIsLoading(false)
          return
        }

        const postsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.POSTS,
          [Query.equal("$id", postIds)]
        )

        const userIds = [...new Set(postsRes.documents.map(p => p.user_id))]
        let profileMap: Record<string, any> = {}

        if (userIds.length > 0) {
          const profilesRes = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.PROFILES,
            [Query.equal("$id", userIds)]
          )
          profileMap = profilesRes.documents.reduce((acc, p) => ({ ...acc, [p.$id]: p }), {})
        }

        const mappedPosts = postsRes.documents.map(p => ({
          id: p.$id,
          image_url: p.image_url,
          caption: p.caption,
          post_date: p.post_date,
          aspect_ratio: p.aspect_ratio,
          profiles: {
            username: profileMap[p.user_id]?.username || "Unknown",
            avatar_url: profileMap[p.user_id]?.avatar_url,
            member_badge: profileMap[p.user_id]?.member_badge
          }
        }))

        // Preserve order based on likes if possible? Appwrite return might differ.
        // We can sort in memory by like creation time?
        // mappedPosts is based on postsRes which is " IN ids". Appwrite returns based on ID lookup or default order.
        // Let's rely on mappedPosts for now.
        setPosts(mappedPosts)

      } catch (error) {
        console.error("Liked posts fetch error", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchLikedPosts()
    }
  }, [user])

  if (loading || (user && isLoading)) {
    return <FeedSkeleton /> // Or custom skeleton
  }

  if (!user) return null

  return <LikedPostsView posts={posts} currentUserId={user.$id} />
}
