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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", lowerUsername)
    .maybeSingle()

  if (error || !profile) {
    notFound()
  }

  const [postsResult, linksResult, repostsResult, userResult] = await Promise.all([
    supabase.from("posts").select("*").eq("user_id", profile.id).order("order_index", { ascending: true }),
    supabase.from("profile_links").select("*").eq("profile_id", profile.id).order("order_index", { ascending: true }),
    supabase.from("reposts").select("*, posts(*)").eq("user_id", profile.id).order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ])

  const posts = postsResult.data || []
  const links = linksResult.data || []
  const reposts = repostsResult.data || []
  const currentUser = userResult.data.user

  let isFollowing = false
  if (currentUser && currentUser.id !== profile.id) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle()
    isFollowing = !!follow
  }

  return (
    <ProfileView
      profile={profile}
      posts={posts}
      links={links}
      reposts={reposts}
      currentUserId={currentUser?.id}
      isFollowing={isFollowing}
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

// Profile sayfası force-dynamic olmalı çünkü:
// 1. Auth durumuna göre farklı içerik (takip butonu, düzenleme vs)
// 2. Supabase RLS politikaları ISR cache'i ile çakışıyor
export const dynamic = "force-dynamic"
