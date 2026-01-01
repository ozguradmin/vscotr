"use client"

import { X, LogOut, Moon, Sun } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const supabase = createClient()
    const router = useRouter()

    if (!isOpen) return null

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background w-full max-w-sm rounded-lg shadow-lg overflow-hidden border border-border">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Ayarlar</h2>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-2">
                    <Link
                        href="/ayarlar"
                        onClick={onClose}
                        className="flex items-center gap-3 w-full p-3 hover:bg-accent rounded-md transition-colors"
                    >
                        <span className="font-medium">Hesap Ayarları</span>
                    </Link>

                    <button
                        onClick={() => alert("Tema değiştirme henüz aktif değil")}
                        className="flex items-center gap-3 w-full p-3 hover:bg-accent rounded-md transition-colors"
                    >
                        <Moon className="w-5 h-5" />
                        <span className="font-medium">Görünüm</span>
                    </button>

                    <div className="h-px bg-border my-2" />

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full p-3 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Çıkış Yap</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
