export function PostSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full bg-muted" style={{ aspectRatio: 1, minHeight: "300px" }} />
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-1 space-y-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse break-inside-avoid w-full bg-muted"
          style={{ aspectRatio: Math.random() > 0.5 ? 1 : 0.75, minHeight: "150px" }}
        />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse px-4 py-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1">
          <div className="h-8 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
      </div>
      <div className="h-4 w-full bg-muted rounded mb-2" />
      <div className="h-4 w-2/3 bg-muted rounded mb-6" />
      <div className="h-10 w-32 bg-muted rounded" />
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto">
        <div className="h-14 bg-muted animate-pulse mb-4" />
        <PostSkeleton />
        <PostSkeleton />
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around h-full px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-6 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function DiscoverSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <GridSkeleton />
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around h-full px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-6 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProfileViewSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
            <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto">
        <ProfileSkeleton />
        <GridSkeleton />
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around h-full px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-6 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
