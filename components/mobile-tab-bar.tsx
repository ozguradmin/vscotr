"use client"

import type React from "react"

import Link from "next/link"
import { Home, Compass, PlusCircle, User, LogIn } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

interface MobileTabBarProps {
  currentUserId?: string
  username?: string
}

export function MobileTabBar({ currentUserId, username }: MobileTabBarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => pathname === path

  const handleTabClick = (e: React.MouseEvent, path: string) => {
    if (pathname === path) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
      router.refresh()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/akis"
          onClick={(e) => handleTabClick(e, "/akis")}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive("/akis") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Ana Sayfa</span>
        </Link>

        <Link
          href="/kesfet"
          onClick={(e) => handleTabClick(e, "/kesfet")}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive("/kesfet") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Compass className="w-6 h-6" />
          <span className="text-xs mt-1">Keşfet</span>
        </Link>

        {currentUserId ? (
          <>
            <Link
              href="/olustur"
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive("/olustur") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <PlusCircle className="w-6 h-6" />
              <span className="text-xs mt-1">Paylaş</span>
            </Link>

            <Link
              href={`/${username}`}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                pathname?.startsWith(`/${username}`) || pathname === "/ayarlar" || pathname?.startsWith("/profil/")
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Profil</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/giris"
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive("/giris") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <LogIn className="w-6 h-6" />
              <span className="text-xs mt-1">Giriş</span>
            </Link>

            <Link
              href="/kayit"
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive("/kayit") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Kayıt</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
