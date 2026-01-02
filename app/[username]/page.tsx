import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileView } from "@/components/profile-view"
import { ProfileViewSkeleton } from "@/components/skeleton-loader"

const RESERVED_ROUTES = new Set([
  "admin",
  "akis",
  "ayarlar",
  "begendiklerim",
  "giris",
  "gizlilik",
  "hakkinda",
  "kayit-basarili",
  "kayit",
  "kesfet",
  "olustur",
  "sartlar",
  "api",
  "_next",
  "favicon.ico",
])

interface PageProps {
  params: Promise<{ username: string }>
}

async function ProfileContent({ username }: { username: string }) {
  const supabase = await createClient()
  const lowerUsername = username.toLowerCase()

  // Önce profili çek
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, member_badge, location")
    .eq("username", lowerUsername)
    .maybeSingle()

  if (error || !profile) {
    notFound()
  }

  // Auth'u ayrı çek (hızlı)
  const userResult = await supabase.auth.getUser()
  const currentUser = userResult.data.user

  // Posts query - simplified to avoid timeout
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select("id, image_url, caption, post_date, aspect_ratio, order_index, user_id, created_at")
    .eq("user_id", profile.id)
    .order("order_index", { ascending: true })
    .limit(15)

  if (postsError) {
    console.error("Error fetching posts:", postsError)
  }

  const posts = postsData || []

  // Links ve reposts paralel
  const [linksResult, repostsResult] = await Promise.all([
    supabase
      .from("profile_links")
      .select("id, label, url")
      .eq("profile_id", profile.id)
      .order("order_index", { ascending: true })
      .limit(10),
    supabase
      .from("reposts")
      .select("id, created_at, post_id")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const links = linksResult.data || []

  // Repost'ların post detaylarını ayrı çek
  let reposts: any[] = []
  if (repostsResult.data && repostsResult.data.length > 0) {
    const postIds = repostsResult.data.map(r => r.post_id)
    const { data: repostPosts } = await supabase
      .from("posts")
      .select("id, image_url, caption, aspect_ratio, user_id")
      .in("id", postIds)

    reposts = repostsResult.data.map(r => ({
      ...r,
      posts: repostPosts?.find(p => p.id === r.post_id) || null
    })).filter(r => r.posts)
  }

  // DEBUG: Log v6
  console.log('[Profile Debug v6]', {
    username: profile.username,
    postsCount: posts.length,
    hasCurrentUser: !!currentUser,
  })

  let isFollowing = false
  if (currentUser && currentUser.id !== profile.id) {
    return (
      <ProfileView
        profile={profile}
        posts={posts}
        links={links}
        reposts={reposts}
        currentUserId={currentUser?.id}
        isFollowing={false} // Client-side will fetch this
        isOwnProfile={currentUser?.id === profile.id}
      />
    )
  }

  return (
    <ProfileView
      profile={profile}
      posts={posts}
      links={links}
      reposts={reposts}
      currentUserId={currentUser?.id}
      isFollowing={false}
      isOwnProfile={currentUser?.id === profile.id}
    />
  )
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const lowerUsername = username.toLowerCase()

  if (RESERVED_ROUTES.has(lowerUsername)) {
    notFound()
  }

  return (
    <Suspense fallback={<ProfileViewSkeleton />}>
      <ProfileContent username={username} />
    </Suspense>
  )
}

// ISR: Cache for 60 seconds
export const revalidate = 60
