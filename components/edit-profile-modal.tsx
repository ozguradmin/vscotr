"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

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
    posts?: any[] // Added for Grid Preview
}

export function EditProfileModal({ isOpen, onClose, currentProfile, posts = [] }: EditProfileModalProps) {
    const [displayName, setDisplayName] = useState(currentProfile.display_name || "")
    const [bio, setBio] = useState(currentProfile.bio || "")
    const [loading, setLoading] = useState(false)
    const [previewPosts, setPreviewPosts] = useState(posts)
    const { refreshUser } = useAuth() // Get refreshUser from context

    const router = useRouter()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                currentProfile.id,
                {
                    display_name: displayName,
                    bio: bio,
                    updated_at: new Date().toISOString(),
                }
            )

            await refreshUser() // Force update auth context to reflect username change immediately
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

                {/* Grid Preview Section (Client Only for now) */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <h3 className="text-sm font-medium mb-3">Grid Düzeni (Önizleme)</h3>
                    <p className="text-xs text-muted-foreground mb-3">Şu anki görsel düzen. Özel sıralama yakında eklenecek.</p>
                    <div className="grid grid-cols-3 gap-1 max-h-[120px] overflow-y-auto pr-1">
                        {previewPosts.slice(0, 9).map((post: any) => (
                            <div key={post.id} className="aspect-square bg-muted relative group overflow-hidden rounded-sm">
                                {post.image_url ? (
                                    <img src={post.image_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-muted" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
