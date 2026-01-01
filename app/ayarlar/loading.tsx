export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b border-border h-14" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-8 w-32 bg-muted rounded mb-6 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  )
}
