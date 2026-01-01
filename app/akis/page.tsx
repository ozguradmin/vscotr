import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FeedView } from "@/components/feed-view"
import { FeedSkeleton } from "@/components/skeleton-loader"

async function FeedContent({ userId, username }: { userId: string; username: string }) {
  const supabase = await createClient()

  const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", userId)

  const followingIds = follows?.map((f) => f.following_id) || []

  let posts: any[] = []
  if (followingIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, avatar_url, member_badge)")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50)
    posts = data || []
  }

  return <FeedView posts={posts} currentUserId={userId} currentUsername={username} />
}

export default async function AkisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/giris")
  }

  let currentProfile = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!currentProfile.data) {
    const username = user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`
    await supabase.from("profiles").insert({
      id: user.id,
      username: username.toLowerCase(),
      display_name: username,
      bio: null,
      avatar_url: null,
      location: null,
      member_badge: null,
      is_admin: false,
    })
    currentProfile = await supabase.from("profiles").select("*").eq("id", user.id).single()
  }

  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent userId={user.id} username={currentProfile.data?.username || ""} />
    </Suspense>
  )
}

export const dynamic = "force-dynamic"
export const revalidate = 0
