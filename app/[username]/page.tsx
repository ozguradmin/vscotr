import { Suspense } from "react"
import { ProfileViewClient } from "@/components/profile-view-client"
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
  "p",
  "profil"
])

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const lowerUsername = username.toLowerCase()

  // Check reserved routes - return 404
  if (RESERVED_ROUTES.has(lowerUsername)) {
    const { notFound } = await import("next/navigation")
    notFound()
  }

  return (
    <Suspense fallback={<ProfileViewSkeleton />}>
      <ProfileViewClient username={lowerUsername} />
    </Suspense>
  )
}

// ISR: Cache for 60 seconds
export const revalidate = 60
