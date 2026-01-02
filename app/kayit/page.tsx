"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { account, databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { ID, Query } from "appwrite"
import { useAuth } from "@/lib/auth-context"

export default function KayitPage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { refreshUser, logout } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Şifreler eşleşmiyor")
      setIsLoading(false)
      return
    }

    if (username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı")
      setIsLoading(false)
      return
    }

    // 0. AGGRESSIVE LOGIN CLEAR
    try {
      await logout() // Clear context state
    } catch (e) { console.log('Logout context error ignored', e) }

    try {
      await account.deleteSession('current') // Force SDK clear
    } catch (e) { console.log('SDK deleteSession error ignored', e) }

    // Tiny delay to ensure propagation
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // 1. Check Username Uniqueness
      const existingUsers = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        [Query.equal("username", username.toLowerCase())]
      )

      if (existingUsers.documents.length > 0) {
        setError("Bu kullanıcı adı zaten alınmış")
        setIsLoading(false)
        return
      }

      // 2. Create Account
      const newUser = await account.create(ID.unique(), email, password, username)

      // 3. Create Session (Login)
      try {
        await account.createEmailPasswordSession(email, password)
      } catch (sessionErr: any) {
        console.error("Session create error", sessionErr)
        // If somehow session active error persists, try one more delete and retry
        if (sessionErr?.message?.includes("active")) {
          await account.deleteSession('current')
          await account.createEmailPasswordSession(email, password)
        } else {
          throw sessionErr
        }
      }

      // 4. Create Profile Document
      await databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        newUser.$id,
        {
          username: username.toLowerCase(),
          display_name: username,
          avatar_url: null,
          bio: null
        }
      )

      // 5. Refresh Context & Redirect
      await refreshUser()
      router.push(`/${username.toLowerCase()}`)

    } catch (error: any) {
      console.error("[Register] Signup error:", error)
      if (error?.message?.includes("Password") && error?.message?.includes("short")) {
        setError("Şifre en az 8 karakter olmalıdır")
      } else if (error?.type === 'user_already_exists') {
        setError("Bu e-posta adresi ile zaten bir hesap mevcut")
      } else {
        setError(error.message || "Bir hata oluştu")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <VscoLogo className="w-12 h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-semibold">Kayıt Ol</h1>
          <p className="text-sm text-muted-foreground mt-2">Ücretsiz hesap oluştur</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              type="text"
              placeholder="kullaniciadi"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repeatPassword">Şifre Tekrar</Label>
            <Input
              id="repeatPassword"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="text-foreground underline underline-offset-4">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
