"use client"

import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <VscoLogo className="w-20 h-20 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-4xl font-light text-foreground">Bir hata oluştu</h1>
          <p className="text-muted-foreground">Profil yüklenirken bir sorun oluştu.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={reset} variant="outline">
            Tekrar Dene
          </Button>
          <Link href="/kesfet">
            <Button>Keşfet</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
