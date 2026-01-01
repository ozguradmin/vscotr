import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { DiscoverView } from "@/components/discover-view"
import { DiscoverSkeleton } from "@/components/skeleton-loader"

async function DiscoverContent() {
  const supabase = await createClient()

  // Önce auth ve posts'u paralel çek (JOIN olmadan)
  const [postsResult, userResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, image_url, caption, aspect_ratio, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50), // 100'den 50'ye düşürdük
    supabase.auth.getUser(),
  ])

  const rawPosts = postsResult.data || []
  const user = userResult.data.user

  // DEBUG
  console.log('[Kesfet Debug v4]', {
    postsCount: rawPosts.length,
    postsError: postsResult.error,
    hasCurrentUser: !!user,
  })

  // Post'ların profillerini ayrı çek (daha hızlı)
  let posts: any[] = []
  if (rawPosts.length > 0) {
    const userIds = [...new Set(rawPosts.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, member_badge")
      .in("id", userIds)

    posts = rawPosts.map(post => ({
      ...post,
      profiles: profiles?.find(p => p.id === post.user_id) || { id: post.user_id, username: 'unknown', avatar_url: null, member_badge: null }
    }))
  }

  let currentUsername = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
    currentUsername = profile?.username
  }

  return <DiscoverView posts={posts} currentUserId={user?.id} currentUsername={currentUsername} />
}

export default function KesfetPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverContent />
    </Suspense>
  )
}

// Supabase RLS politikaları auth gerektiriyorsa force-dynamic gerekli
export const dynamic = "force-dynamic"
