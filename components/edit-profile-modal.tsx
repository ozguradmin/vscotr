"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentProfile: {
        id: string
        username: string
        display_name: string | null
        bio: string | null
        avatar_url: string | null
    }
}

export function EditProfileModal({ isOpen, onClose, currentProfile }: EditProfileModalProps) {
    const [displayName, setDisplayName] = useState(currentProfile.display_name || "")
    const [bio, setBio] = useState(currentProfile.bio || "")
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: displayName,
                    bio: bio,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", currentProfile.id)

            if (error) throw error

            router.refresh()
            onClose()
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Profil güncellenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background w-full max-w-md rounded-lg shadow-lg overflow-hidden border border-border">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Profili Düzenle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="displayName" className="text-sm font-medium">
                            Görünen Ad
                        </label>
                        <input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
                            placeholder="Adın"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="bio" className="text-sm font-medium">
                            Biyografi
                        </label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground min-h-[100px] resize-none"
                            placeholder="Kendinden bahset..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-foreground text-background font-medium rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
