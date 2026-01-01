import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { DiscoverView } from "@/components/discover-view"
import { DiscoverSkeleton } from "@/components/skeleton-loader"

async function DiscoverContent() {
  const supabase = await createClient()

  const [postsResult, userResult] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(id, username, avatar_url, member_badge)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.auth.getUser(),
  ])

  const posts = postsResult.data || []
  const user = userResult.data.user

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

// ISR: 60 saniye cache, public içerik daha uzun cache'lenebilir
export const revalidate = 60
