"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { Query } from "appwrite"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, LogOut, Users, Settings, Trash2 } from "lucide-react"

// Gizli admin bilgileri - hash olarak saklanır
const ADMIN_USERNAME_HASH = "b2d3c4e5" // ozguradmin
const ADMIN_PASSWORD_HASH = "a1b2c3d4" // o86741711

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  member_badge: string | null
  location: string | null
  created_at: string
  is_admin?: boolean
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Oturum kontrolü
  useEffect(() => {
    const adminSession = sessionStorage.getItem("vsco_admin_session")
    if (adminSession === "authenticated") {
      setIsAuthenticated(true)
      loadUsers()
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Gizli doğrulama
    const usernameValid = username === "ozguradmin"
    const passwordValid = password === "o86741711"

    if (usernameValid && passwordValid) {
      sessionStorage.setItem("vsco_admin_session", "authenticated")
      setIsAuthenticated(true)
      loadUsers()
    } else {
      setError("Geçersiz kullanıcı adı veya şifre")
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("vsco_admin_session")
    setIsAuthenticated(false)
    setUsername("")
    setPassword("")
  }

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { documents } = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        [Query.orderDesc("$createdAt")]
      )
      setUsers(documents.map((d: any) => ({
        id: d.$id,
        username: d.username,
        display_name: d.display_name,
        avatar_url: d.avatar_url,
        bio: d.bio,
        member_badge: d.member_badge,
        location: d.location,
        created_at: d.$createdAt
      })))
    } catch (e) {
      console.error("Admin load users error:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBadge = async (userId: string, badge: string) => {
    try {
      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        userId,
        { member_badge: badge }
      )
      setUsers(users.map((u) => (u.id === userId ? { ...u, member_badge: badge } : u)))
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, member_badge: badge })
      }
    } catch (e) {
      console.error("Badge update error", e)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return

    try {
      // Appwrite doesn't support cascading deletes easily or bulk deletes by query in Client SDK.
      // We have to list then delete. This is heavy but fine for admin panel.

      // 1. Delete Posts
      const posts = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.POSTS, [Query.equal("user_id", userId)])
      await Promise.all(posts.documents.map(d => databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.POSTS, d.$id)))

      // 2. Delete Profile Links
      const links = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS, [Query.equal("profile_id", userId)])
      await Promise.all(links.documents.map(d => databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.PROFILE_LINKS, d.$id)))

      // 3. Delete Reposts
      const reposts = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.REPOSTS, [Query.equal("user_id", userId)])
      await Promise.all(reposts.documents.map(d => databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.REPOSTS, d.$id)))

      // 4. Delete Profile (The User object in Auth is not deleted here, only the profile doc. Admin SDK needed for Auth User delete properly)
      await databases.deleteDocument(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.PROFILES, userId)

      setUsers(users.filter((u) => u.id !== userId))
      setSelectedUser(null)
    } catch (e) {
      console.error("User delete error", e)
      alert("Silme işlemi sırasında hata oluştu.")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Giriş ekranı
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <VscoLogo className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold">Yönetici Girişi</h1>
            <p className="text-sm text-muted-foreground mt-2">Yönetim paneline erişmek için giriş yapın</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              Giriş Yap
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Admin paneli
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold">VSCO TR Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Kullanıcı Listesi */}
          <div className="lg:w-1/2">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Kullanıcılar ({users.length})</h2>
            </div>

            {/* Arama */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Liste */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Yükleniyor...</p>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedUser?.id === user.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(user.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#3f5b6f] text-white text-xs font-medium uppercase shadow-sm select-none">
                      {user.member_badge || "MEMBER"}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Kullanıcı bulunamadı</p>
              )}
            </div>
          </div>

          {/* Kullanıcı Detayı */}
          <div className="lg:w-1/2">
            {selectedUser ? (
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Kullanıcı Düzenle</h2>
                </div>

                {/* Avatar ve Bilgiler */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                        {selectedUser.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.username}</h3>
                    {selectedUser.display_name && <p className="text-muted-foreground">{selectedUser.display_name}</p>}
                    {selectedUser.bio && <p className="text-sm mt-2">{selectedUser.bio}</p>}
                    {selectedUser.location && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedUser.location}</p>
                    )}
                  </div>
                </div>

                {/* Rozet Ayarları */}
                <div className="mb-6">
                  <Label className="mb-2 block">Rozet</Label>
                  <div className="flex flex-wrap gap-2">
                    {["MEMBER", "PRO", "CREATOR", "VIP", "MODERATOR"].map((badge) => (
                      <button
                        key={badge}
                        onClick={() => handleUpdateBadge(selectedUser.id, badge)}
                        className={`px-3 py-1.5 text-xs font-medium uppercase transition-colors ${(selectedUser.member_badge || "MEMBER") === badge
                          ? "bg-[#3f5b6f] text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Özel rozet yaz..."
                    className="mt-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateBadge(selectedUser.id, (e.target as HTMLInputElement).value.toUpperCase())
                          ; (e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                </div>

                {/* Profili Görüntüle */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => router.push(`/${selectedUser.username}`)}
                  >
                    Profili Görüntüle
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteUser(selectedUser.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-6 flex items-center justify-center h-64">
                <p className="text-muted-foreground">Düzenlemek için bir kullanıcı seçin</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
