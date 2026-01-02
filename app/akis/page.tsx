"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FeedView } from "@/components/feed-view"
import { FeedSkeleton } from "@/components/skeleton-loader"
import { useAuth } from "@/lib/auth-context"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { Query } from "appwrite"

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

export default function AkisPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/giris")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchFeed() {
      if (!user) return

      try {
        // 1. Get Follows
        const followsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.FOLLOWS,
          [Query.equal("follower_id", user.$id), Query.limit(100)]
        )

        const followingIds = followsRes.documents.map((f) => f.following_id)

        if (followingIds.length === 0) {
          setPosts([])
          setIsLoadingFeed(false)
          return
        }

        // 2. Get Posts from Following
        // Note: Query.equal('user_id', array) works as "IN" query
        const postsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.POSTS,
          [
            Query.equal("user_id", followingIds),
            Query.orderDesc("created_at"),
            Query.limit(50)
          ]
        )

        // 3. Get Profiles for Posts (Manual usage, optimized with unique IDs)
        const userIds = [...new Set(postsRes.documents.map((p) => p.user_id))]

        let profilesData: Record<string, any> = {}

        if (userIds.length > 0) {
          const profilesRes = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.PROFILES,
            [Query.equal("$id", userIds)]
          )
          profilesData = profilesRes.documents.reduce((acc, profile) => {
            acc[profile.$id] = profile
            return acc
          }, {} as Record<string, any>)
        }

        // 4. Map Data
        const mappedPosts: Post[] = postsRes.documents.map((doc) => {
          const profile = profilesData[doc.user_id]
          return {
            id: doc.$id,
            image_url: doc.image_url,
            caption: doc.caption,
            post_date: doc.created_at,
            aspect_ratio: doc.aspect_ratio || 1,
            profiles: {
              username: profile?.username || "Unknown",
              avatar_url: profile?.avatar_url || null,
              member_badge: profile?.member_badge || null
            }
          }
        })

        setPosts(mappedPosts)

      } catch (error) {
        console.error("Feed fetch error:", error)
      } finally {
        setIsLoadingFeed(false)
      }
    }

    if (user) {
      fetchFeed()
    }
  }, [user])

  if (loading || (user && isLoadingFeed)) {
    return <FeedSkeleton />
  }

  if (!user) return null

  return <FeedView posts={posts} currentUserId={user.$id} currentUsername={user.name} />
}
