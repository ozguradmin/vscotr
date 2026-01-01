import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LikedPostsView } from "@/components/liked-posts-view"

export default async function LikedPostsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/giris")
  }

  // Beğenilen gönderileri al
  const { data: likes } = await supabase
    .from("likes")
    .select(
      `
      post_id,
      created_at,
      posts (
        id,
        image_url,
        caption,
        post_date,
        aspect_ratio,
        profiles (
          username,
          avatar_url,
          member_badge
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const likedPosts = likes?.map((like: any) => like.posts).filter(Boolean) || []

  return <LikedPostsView posts={likedPosts} currentUserId={user.id} />
}
