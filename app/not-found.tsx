import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <VscoLogo className="w-20 h-20 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-6xl font-light text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Sayfa Bulunamadı</p>
          <p className="text-sm text-muted-foreground">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="px-6 py-3 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/kesfet"
            className="px-6 py-3 border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            Keşfet
          </Link>
        </div>
      </div>
    </div>
  )
}
