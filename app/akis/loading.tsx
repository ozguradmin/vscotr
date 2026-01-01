import { PostSkeleton } from "@/components/skeleton-loader"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border h-14" />
      <main className="max-w-2xl mx-auto">
        <div className="h-14 border-b border-border" />
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
