import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ProfileView } from "@/components/profile-view"
import { ProfileViewSkeleton } from "@/components/skeleton-loader"
import { adminDatabases, APPWRITE_CONFIG } from "@/lib/appwrite/server"
import { Query } from "node-appwrite"

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
  const lowerUsername = username.toLowerCase()

  try {
    // Appwrite: Fetch profile by username
    const profileResponse = await adminDatabases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.PROFILES,
      [Query.equal("username", lowerUsername)]
    )

    const profileDoc = profileResponse.documents[0]

    if (!profileDoc) {
      notFound()
    }

    // Map Appwrite document to Profile interface
    // Note: Appwrite uses $id, we map it to id for compatibility
    const profile = {
      id: profileDoc.$id,
      username: profileDoc.username,
      display_name: profileDoc.display_name,
      avatar_url: profileDoc.avatar_url,
      bio: profileDoc.bio,
      member_badge: profileDoc.member_badge,
      location: profileDoc.location
    }

    // Fetch profile links
    let links: { id: string; label: string; url: string }[] = []
    try {
      const linksResponse = await adminDatabases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS,
        [Query.equal("profile_id", profileDoc.$id), Query.orderAsc("order_index")]
      )
      links = linksResponse.documents.map(doc => ({
        id: doc.$id,
        label: doc.label || "",
        url: doc.url
      }))
    } catch (e) {
      console.error("Links fetch error:", e)
    }

    // Server-side auth check skipped for speed/simplicity in this migration.
    // Client-side 'AuthContext' will handle currentUserId.
    // We pass null for now, triggering client-side check if needed.

    return (
      <ProfileView
        profile={profile}
        posts={[]} // Client loads posts
        links={links}
        reposts={[]}
        isOwnProfile={false} // Client will verify ownership based on currentUserId
      />
    )
  } catch (error) {
    console.error("Profile fetch error:", error)
    notFound()
  }
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

