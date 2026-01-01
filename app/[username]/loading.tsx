import { ProfileSkeleton, GridSkeleton } from "@/components/skeleton-loader"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border h-14" />
      <ProfileSkeleton />
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-b border-border mb-4">
          <div className="flex gap-8">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <GridSkeleton />
      </div>
    </div>
  )
}
