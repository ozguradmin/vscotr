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

  // Server-side fetching kaldırıldı (Hız için client'a devredildi)
  const posts: any[] = []
  const reposts: any[] = []
  const links: any[] = []

  let isFollowing = false
  if (currentUser && currentUser.id !== profile.id) {
    // isFollowing client-side çekilecek
  }

  return (
    <ProfileView
      profile={profile}
      posts={[]} // Boş dizi gönderiyoruz, client dolduracak
      links={[]} // Linkleri de client çekebilir veya buraya ekleyebiliriz ama hız için boş
      reposts={[]} // Repostlar da client'a emanet
      currentUserId={currentUser?.id}
      isOwner={currentUser?.id === profile.id}
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
