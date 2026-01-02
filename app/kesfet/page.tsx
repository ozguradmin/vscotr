"use client"

import { Suspense } from "react"
import { DiscoverView } from "@/components/discover-view"
import { DiscoverSkeleton } from "@/components/skeleton-loader"
import { useAuth } from "@/lib/auth-context"

function DiscoverContent() {
  const { user } = useAuth()
  return <DiscoverView posts={[]} currentUserId={user?.$id} currentUsername={user?.name /* Or fetch if needed but name is in account */ || user?.email} />
}

export default function KesfetPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverContent />
    </Suspense>
  )
}
