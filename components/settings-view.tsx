"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { databases, storage, account, APPWRITE_CONFIG, ID, Query } from "@/lib/appwrite/client"
import { VscoImage } from "@/components/vsco-image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Search, Menu, X, Plus, Trash2, Upload, Key, User, RotateCcw } from "lucide-react"
import { VscoLogo } from "@/components/vsco-logo"
import { MobileMenu } from "@/components/mobile-menu"
import { SearchModal } from "@/components/search-modal"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { ManualSortModal } from "@/components/manual-sort-modal"
import { Grid } from "lucide-react"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  member_badge: string | null
  location: string | null
}

interface ProfileLink {
  id: string
  label: string | null
  url: string
  order_index: number
}

interface Post {
  id: string
  image_url: string
  caption: string | null
  post_date: string | null
  aspect_ratio: number
  order_index: number
}

interface Repost {
  id: string
  post_id: string
  created_at: string
  posts: {
    id: string
    image_url: string
    caption: string | null
    aspect_ratio: number
  }
}

interface SettingsViewProps {
  profile: Profile | null
  links: ProfileLink[]
  posts: Post[]
  reposts: Repost[]
  userId: string
  userEmail: string
}

export function SettingsView({
  profile,
  links: initialLinks,
  posts: initialPosts,
  reposts: initialReposts,
  userId,
  userEmail,
}: SettingsViewProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "posts" | "reposts" | "account">("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: profile?.username || "",
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    avatar_url: profile?.avatar_url || "",
  })
  const [links, setLinks] = useState(initialLinks)
  const [posts, setPosts] = useState(initialPosts)
  const [reposts, setReposts] = useState(initialReposts)
  const [deletePostConfirm, setDeletePostConfirm] = useState<string | null>(null)
  const [showSortModal, setShowSortModal] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'image/jpeg'
        })
      });
      if (!presignRes.ok) throw new Error('Avatar upload init failed');
      const { uploadUrl, publicUrl } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' }
      });
      if (!uploadRes.ok) throw new Error('Avatar upload failed');
      const avatarUrl = publicUrl;

      setFormData({ ...formData, avatar_url: avatarUrl })
    } catch (error) {
      console.error("Avatar upload error", error)
      showToast("Avatar yüklenemedi")
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setAccountError(null)

    try {
      // 1. Check Username Uniqueness if changed
      if (formData.username !== profile?.username) {
        if (formData.username.length < 3) {
          setAccountError("Kullanıcı adı en az 3 karakter olmalı")
          setIsSaving(false)
          return
        }

        const existingUsers = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.PROFILES,
          [Query.equal("username", formData.username.toLowerCase())]
        )

        if (existingUsers.documents.length > 0 && existingUsers.documents[0].$id !== userId) {
          setAccountError("Bu kullanıcı adı zaten alınmış")
          setIsSaving(false)
          return
        }
      }

      // Update Profile
      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        userId,
        {
          username: formData.username.toLowerCase(),
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          location: formData.location || null,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString(),
        }
      )

      // Update Links: Appwrite doesn't support "delete where". We must list then delete.
      const linksRes = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS,
        [Query.equal("profile_id", userId)]
      )

      await Promise.all(linksRes.documents.map(link =>
        databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS, link.$id)
      ))

      if (links.length > 0) {
        await Promise.all(links.filter(l => l.url && l.url.trim()).map((link, index) => {
          // Ensure URL has protocol for Appwrite validation
          let url = link.url.trim()
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url
          }
          return databases.createDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS,
            ID.unique(),
            {
              profile_id: userId,
              label: link.label || null,
              url: url,
              order_index: index
            }
          )
        }))
      }

      showToast("Profil başarıyla kaydedildi")
      setTimeout(() => {
        router.push(`/${formData.username}`)
        router.refresh()
      }, 1000)
    } catch (error: any) {
      console.error("Kaydetme hatası:", error)
      showToast("Kaydetme sırasında hata: " + (error?.message || "Bilinmeyen hata"))
      if (error?.message?.includes("Unknown attribute")) {
        setAccountError("Sistem hatası: Veritabanı şeması eksik. Lütfen geliştiriciye bildirin (Unknown Attribute).")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeUsername = async () => {
    setAccountError(null)
    setAccountSuccess(null)

    if (newUsername.length < 3) {
      setAccountError("Kullanıcı adı en az 3 karakter olmalı")
      return
    }

    try {
      const existingUsers = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        [Query.equal("username", newUsername.toLowerCase())]
      )

      // Check if exists and is NOT the current user
      if (existingUsers.documents.length > 0 && existingUsers.documents[0].$id !== userId) {
        setAccountError("Bu kullanıcı adı zaten alınmış")
        return
      }

      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        userId,
        { username: newUsername.toLowerCase() }
      )

      showToast("Kullanıcı adı başarıyla değiştirildi")
      setFormData({ ...formData, username: newUsername.toLowerCase() })

    } catch (error: any) {
      setAccountError("Kullanıcı adı değiştirilemedi: " + error.message)
    }
  }

  const handleChangePassword = async () => {
    setAccountError(null)
    setAccountSuccess(null)

    if (newPassword.length < 8) { // Appwrite min 8 chars usually
      setAccountError("Yeni şifre en az 8 karakter olmalı")
      return
    }

    if (newPassword !== confirmPassword) {
      setAccountError("Şifreler eşleşmiyor")
      return
    }

    if (!currentPassword) {
      setAccountError("Mevcut şifrenizi girmelisiniz")
      return
    }

    try {
      await account.updatePassword(newPassword, currentPassword)
      showToast("Şifre başarıyla değiştirildi")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setAccountError("Şifre değiştirilemedi: " + error.message)
    }
  }

  const [newUsername, setNewUsername] = useState(profile?.username || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null)

  const addLink = () => {
    setLinks([...links, { id: `new- ${Date.now()} `, label: "", url: "", order_index: links.length }])
  }

  const removeLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id))
  }

  const updateLink = (id: string, field: "label" | "url", value: string) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const handleDeletePost = async (postId: string) => {
    setDeletePostConfirm(postId)
  }

  const confirmDeletePost = async () => {
    if (!deletePostConfirm) return

    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.POSTS,
        deletePostConfirm
      )
      setPosts(posts.filter((p) => p.id !== deletePostConfirm))
      setDeletePostConfirm(null)
      router.refresh()
    } catch (e) {
      console.error("Delete post error", e)
      showToast("Gönderi silinemedi")
    }
  }

  const handleUpdatePostOrder = async (postId: string, direction: "up" | "down") => {
    const index = posts.findIndex((p) => p.id === postId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === posts.length - 1) return

    const newPosts = [...posts]
    const swapIndex = direction === "up" ? index - 1 : index + 1
      ;[newPosts[index], newPosts[swapIndex]] = [newPosts[swapIndex], newPosts[index]]

    setPosts(newPosts) // Optimistic update

    try {
      await Promise.all(newPosts.map((p, i) =>
        databases.updateDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTIONS.POSTS,
          p.id,
          { order_index: i }
        )
      ))
    } catch (e) {
      console.error("Order update error", e)
    }
  }

  const handleUpdatePost = async (postId: string, field: "caption" | "post_date", value: string) => {
    try {
      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.POSTS,
        postId,
        { [field]: value || null }
      )
      setPosts(posts.map((p) => (p.id === postId ? { ...p, [field]: value } : p)))
    } catch (e) {
      console.error("Update post error", e)
    }
  }

  const handleDeleteRepost = async (repostId: string) => {
    if (!confirm("Bu repostu silmek istediğinize emin misiniz?")) return

    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.REPOSTS,
        repostId
      )
      setReposts(reposts.filter((r) => r.id !== repostId))
      showToast("Repost silindi")
      router.refresh()
    } catch (e) {
      console.error("Delete repost error", e)
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <Link href={profile?.username ? `/${profile.username.trim()}` : "/"} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <VscoLogo className="w-8 h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-accent rounded-full transition-colors" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentUserId={userId}
        currentUsername={profile?.username}
      />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <h1 className="text-2xl font-semibold mb-6">Ayarlar</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === "profile" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Profil
            {activeTab === "profile" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === "posts" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Gönderiler
            {activeTab === "posts" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
          </button>
          <button
            onClick={() => setActiveTab("reposts")}
            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === "reposts" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Repostlar
            {activeTab === "reposts" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === "account" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Hesap
            {activeTab === "account" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
          </button>
        </div>

        {activeTab === "profile" ? (
          <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer relative group"
                onClick={() => avatarInputRef.current?.click()}
              >
                {formData.avatar_url ? (
                  <VscoImage
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {formData.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button onClick={() => avatarInputRef.current?.click()} className="text-left">
                <p className="font-medium">Profil Fotoğrafı</p>
                <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Değiştirmek için tıkla
                </p>
              </button>
            </div>

            <div>
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                className="mt-1"
                placeholder="kullaniciadi"
              />
              <p className="text-xs text-muted-foreground mt-1">Sadece küçük harf, rakam ve alt çizgi kullanılabilir.</p>
            </div>

            <div>
              <Label htmlFor="bio">Biyografi</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">Konum</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1"
                placeholder="İstanbul, Türkiye"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label>Linkler</Label>
                  <p className="text-xs text-muted-foreground mt-1">Web siteleri ve sosyal medya hesapları</p>
                </div>
                <Button variant="outline" size="sm" onClick={addLink}>
                  <Plus className="w-4 h-4 mr-1" />
                  Link Ekle
                </Button>
              </div>
              <div className="space-y-3">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Başlık (opsiyonel)"
                      value={link.label || ""}
                      onChange={(e) => updateLink(link.id, "label", e.target.value)}
                      className="w-1/3"
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateLink(link.id, "url", e.target.value)}
                      className="flex-1"
                    />
                    <button onClick={() => removeLink(link.id)} className="p-2 hover:bg-accent rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="fixed md:relative bottom-0 left-0 right-0 p-4 md:p-0 bg-background border-t md:border-t-0 border-border md:pt-4 z-40 mb-16 md:mb-0">
              <div className="max-w-2xl mx-auto">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
                {accountError && <p className="text-sm text-red-500 mt-2">{accountError}</p>}
              </div>
            </div>
          </div>
        ) : activeTab === "posts" ? (
          <div className="space-y-4 pb-24 md:pb-6">
            <div className="flex gap-2">
              <Link href="/olustur" className="flex-1">
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Gönderi Ekle
                </Button>
              </Link>
              <Button variant="outline" className="flex-1" onClick={() => setShowSortModal(true)}>
                <Grid className="w-4 h-4 mr-2" />
                Düzeni Manuel Ayarla
              </Button>
            </div>

            <ManualSortModal
              isOpen={showSortModal}
              onClose={() => setShowSortModal(false)}
              posts={posts}
              onSaveSuccess={() => router.refresh()}
            />
            {posts.length > 0 ? (
              <>
                {posts.map((post, index) => (
                  <div key={post.id} className="flex gap-3 p-4 border border-border rounded-lg">
                    <VscoImage
                      src={post.image_url || "/placeholder.svg"}
                      alt=""
                      className="w-20 h-20 rounded flex-shrink-0 transform-none"
                      width={150}
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        placeholder="Açıklama (isteğe bağlı)"
                        value={post.caption || ""}
                        onChange={(e) => handleUpdatePost(post.id, "caption", e.target.value)}
                        className="w-full"
                      />
                      <Input
                        type="date"
                        value={post.post_date ? new Date(post.post_date).toISOString().slice(0, 10) : ""}
                        onChange={(e) => handleUpdatePost(post.id, "post_date", e.target.value)}
                        placeholder="Tarih (isteğe bağlı)"
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-1 flex-shrink-0">
                      {/* Up/Down buttons removed as per request */}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 hover:bg-destructive/10 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Save Button for Posts */}
                <div className="fixed md:relative bottom-0 left-0 right-0 p-4 md:p-0 bg-background border-t md:border-t-0 border-border md:pt-4 z-40 mb-16 md:mb-0">
                  <div className="max-w-2xl mx-auto">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto">
                      {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">Henüz gönderin yok</p>
            )}
          </div>
        ) : activeTab === "reposts" ? (
          <div className="space-y-4">
            {reposts && reposts.length > 0 ? (
              reposts.map((repost) => (
                <div key={repost.id} className="flex gap-4 p-4 border border-border rounded-lg">
                  <VscoImage
                    src={repost.posts.image_url || "/placeholder.svg"}
                    alt=""
                    className="w-20 h-20 rounded flex-shrink-0"
                    aspectRatio={repost.posts.aspect_ratio || 1}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {new Date(repost.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                      })}
                    </p>
                    {repost.posts.caption && <p className="text-sm mt-1">{repost.posts.caption}</p>}
                  </div>
                  <button onClick={() => handleDeleteRepost(repost.id)} className="p-2 hover:bg-accent rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Henüz repostun yok</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">E-posta</p>
              <p className="font-medium">{userEmail}</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Şifre Değiştir</h3>
              <div>
                <Label htmlFor="current_password">Mevcut Şifre</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new_password">Yeni Şifre</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleChangePassword} variant="outline">
                Şifreyi Değiştir
              </Button>
            </div>

            {accountError && <p className="text-sm text-red-500">{accountError}</p>}
            {accountSuccess && <p className="text-sm text-green-500">{accountSuccess}</p>}
          </div>
        )
        }
      </main >

      {deletePostConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Gönderiyi Sil</h3>
            <p className="text-sm text-muted-foreground mb-4">Bu gönderiyi silmek istediğinize emin misiniz?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletePostConfirm(null)} className="flex-1">
                İptal
              </Button>
              <Button onClick={confirmDeletePost} className="flex-1 bg-red-500 hover:bg-red-600">
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}

      {
        toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
            {toast}
          </div>
        )
      }

      <MobileTabBar currentUserId={userId} username={profile?.username} />
    </div >
  )
}
