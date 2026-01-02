"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  currentUsername?: string
}

export function MobileMenu({ isOpen, onClose, currentUserId, currentUsername }: MobileMenuProps) {
  const router = useRouter()
  const { logout, currentProfile } = useAuth()
  const displayUsername = currentProfile?.username || currentUsername

  const handleLogout = async () => {
    await logout()
    router.push("/")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-background pt-14 overflow-y-auto max-h-screen">
      <nav className="p-6 space-y-6 pb-24">
        <Link href="/akis" onClick={onClose} className="block text-2xl font-light hover:text-primary transition-colors">
          Akış
        </Link>
        <Link
          href="/kesfet"
          onClick={onClose}
          className="block text-2xl font-light hover:text-primary transition-colors"
        >
          Keşfet
        </Link>
        {currentUserId && (
          <>
            <Link
              href={`/ ${displayUsername} `}
              onClick={onClose}
              className="text-3xl font-light hover:text-muted-foreground transition-colors"
            >
              Profil
            </Link>
            <Link
              href="/olustur"
              onClick={onClose}
              className="block text-2xl font-light hover:text-primary transition-colors"
            >
              Oluştur
            </Link>
          </>
        )}
        <hr className="border-border" />
        {currentUserId ? (
          <>
            <Link
              href="/begendiklerim"
              onClick={onClose}
              className="block text-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Beğendiğim Gönderiler
            </Link>
            <Link
              href="/ayarlar"
              onClick={onClose}
              className="block text-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Ayarlar
            </Link>
            <button
              onClick={handleLogout}
              className="block text-lg text-red-500 hover:text-red-600 transition-colors w-full text-left"
              aria-label="Çıkış Yap"
            >
              Çıkış Yap
            </button>
          </>
        ) : (
          <>
            <Link
              href="/giris"
              onClick={onClose}
              className="block text-2xl font-light hover:text-primary transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              onClick={onClose}
              className="block text-2xl font-light hover:text-primary transition-colors"
            >
              Hesap Oluştur
            </Link>
          </>
        )}
        <hr className="border-border" />
        <Link
          href="/hakkinda"
          onClick={onClose}
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Hakkında
        </Link>
        <Link
          href="/gizlilik"
          onClick={onClose}
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Gizlilik Politikası
        </Link>
        <Link
          href="/sartlar"
          onClick={onClose}
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Hizmet Şartları
        </Link>
      </nav>
      <div className="sticky bottom-4 left-6 right-6 text-[10px] text-muted-foreground space-y-0.5 bg-background px-6 py-4">
        <p>© 2025 VSCO TR</p>
        <p>Özgür Güler tarafından geliştirildi.</p>
      </div>
    </div>
  )
}
