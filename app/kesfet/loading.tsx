import { GridSkeleton } from "@/components/skeleton-loader"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border h-14" />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-8 w-32 bg-muted rounded mb-6 animate-pulse" />
        <GridSkeleton />
      </main>
    </div>
  )
}
