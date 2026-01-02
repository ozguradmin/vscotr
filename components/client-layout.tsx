"use client"

import { useAuth } from "@/lib/auth-context"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { usePathname } from "next/navigation"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, currentProfile } = useAuth()
    const pathname = usePathname()

    // Don't show tab bar on auth pages
    const isAuthPage = pathname === "/giris" || pathname === "/kayit"
    // Landing page handles its own layout, but we might want tab bar if logged in?
    // Let's hide on landing if NOT logged in, show if logged in.

    const showTabBar = user && !isAuthPage

    const username = currentProfile?.username || user?.name; // Define username once

    return (
        <div className={user ? "pb-16 md:pb-0" : ""}>
            {children}
            {showTabBar && (
                <MobileTabBar
                    currentUserId={user.$id}
                    username={username} // Prefer profile username
                />
            )}
        </div>
    )
}
```
