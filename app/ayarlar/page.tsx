"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SettingsView } from "@/components/settings-view"
import { useAuth } from "@/lib/auth-context"
import { databases, APPWRITE_CONFIG, Query } from "@/lib/appwrite/client"
import { FeedSkeleton } from "@/components/skeleton-loader"

export default function AyarlarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [reposts, setReposts] = useState<any[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/giris")
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        // Fetch Profile
        const profileRes = await databases.getDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.PROFILES,
          user.$id
        )

        setProfile({
          id: profileRes.$id,
          username: profileRes.username,
          display_name: profileRes.display_name,
          avatar_url: profileRes.avatar_url,
          bio: profileRes.bio,
          member_badge: profileRes.member_badge,
          location: profileRes.location
        })

        // Fetch Links
        const linksRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS,
          [Query.equal("profile_id", user.$id), Query.orderAsc("order_index")]
        ).catch(() => ({ documents: [] })) // Fail safe if collection missing

        setLinks(linksRes.documents.map(d => ({
          id: d.$id,
          label: d.label,
          url: d.url,
          order_index: d.order_index
        })))

        // Fetch Posts
        const postsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.POSTS,
          [Query.equal("user_id", user.$id), Query.orderAsc("order_index")]
        )
        setPosts(postsRes.documents.map(p => ({
          id: p.$id,
          image_url: p.image_url,
          caption: p.caption,
          post_date: p.post_date, // or created_at
          aspect_ratio: p.aspect_ratio,
          order_index: p.order_index
        })))

        // Fetch Reposts + Joins
        const repostsRes = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
          [Query.equal("user_id", user.$id)]
        )

        const repostedPostIds = repostsRes.documents.map(r => r.post_id)
        let repostedPosts: Record<string, any> = {}

        if (repostedPostIds.length > 0) {
          const pRes = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.POSTS,
            [Query.equal("$id", repostedPostIds)]
          )
          repostedPosts = pRes.documents.reduce((acc, p) => ({ ...acc, [p.$id]: p }), {})
        }

        setReposts(repostsRes.documents.map(r => ({
          id: r.$id,
          post_id: r.post_id,
          created_at: r.$createdAt,
          posts: repostedPosts[r.post_id] ? {
            id: repostedPosts[r.post_id].$id,
            image_url: repostedPosts[r.post_id].image_url,
            caption: repostedPosts[r.post_id].caption,
            aspect_ratio: repostedPosts[r.post_id].aspect_ratio
          } : { id: 'deleted', image_url: '', caption: 'Deleted', aspect_ratio: 1 } // Fallback
        })).filter(r => r.posts.id !== 'deleted'))

      } catch (error) {
        console.error("Settings data fetch error", error)
      } finally {
        setIsDataLoading(false)
      }
    }

    if (user) fetchData()
  }, [user])

  if (loading || (user && isDataLoading)) {
    return <FeedSkeleton />
  }

  if (!user) return null

  return (
    <SettingsView
      profile={profile}
      links={links}
      posts={posts}
      reposts={reposts}
      userId={user.$id}
      userEmail={user.email || ""}
    />
  )
}
