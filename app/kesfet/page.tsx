import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { DiscoverView } from "@/components/discover-view"
import { DiscoverSkeleton } from "@/components/skeleton-loader"

async function DiscoverContent() {
  const supabase = await createClient()

  // Posts will be fetched on client
  const { data: { user } } = await supabase.auth.getUser()

  // DEBUG v6
  console.log('[Kesfet Debug v6]', {
    hasCurrentUser: !!user,
  })

  const posts: any[] = []

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
