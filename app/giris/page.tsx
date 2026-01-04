"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, db, COLLECTIONS } from "@/lib/firebase/client"
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

export default function GirisPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const followId = searchParams.get('follow')
  const { refreshUser } = useAuth()

  const handlePostLogin = async (user: any) => {
    // 2. Refresh Context
    await refreshUser()

    // 3. Check Profile
    const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, user.uid))
    const profile = profileDoc.exists() ? profileDoc.data() : null

    if (profile && profile.username) {
      // Auto-follow logic
      if (followId && followId !== user.uid) {
        try {
          // Check if already following
          const followsRef = collection(db, COLLECTIONS.FOLLOWS)
          const q = query(followsRef,
            where('follower_id', '==', user.uid),
            where('following_id', '==', followId)
          )
          // ... (rest of logic)
          const checkSnapshot = await getDocs(q)

          if (checkSnapshot.empty) {
            await addDoc(collection(db, COLLECTIONS.FOLLOWS), {
              follower_id: user.uid,
              following_id: followId,
              created_at: new Date()
            })
          }

          const targetProfileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, followId))
          if (targetProfileDoc.exists()) {
            const targetProfile = targetProfileDoc.data()
            if (targetProfile.username) {
              router.push(`/${targetProfile.username}`)
              return
            }
          }
        } catch (e) {
          console.error("Auto follow error", e)
        }
      }
      router.push(`/${profile.username}`)
    } else {
      // If authenticating with Google for first time, create profile automatically
      if (!profile) {
        // Generate a username from email or displayName
        const baseUsername = user.email?.split('@')[0] || user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'
        const username = baseUsername + Math.floor(Math.random() * 1000)

        try {
          await setDoc(doc(db, COLLECTIONS.PROFILES, user.uid), {
            username: username,
            display_name: user.displayName || username,
            avatar_url: user.photoURL || null,
            bio: null,
            member_badge: null,
            location: null,
            grid_sort: null,
            grid_filter: null,
            created_at: new Date(),
            updated_at: new Date()
          })
          await refreshUser()
          router.push(`/${username}`)
          return
        } catch (e) {
          console.error("Error creating profile for Google user:", e)
        }
      }
      router.push("/ayarlar")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await handlePostLogin(userCredential.user)
    } catch (error: any) {
      console.error("Login error:", error)
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
        setError("Geçersiz e-posta veya şifre. Şifrenizi sıfırlamak için 'Şifremi Unuttum' linkini kullanın.")
      } else if (error?.code === "auth/user-not-found") {
        setError("Bu e-posta ile kayıtlı hesap bulunamadı")
      } else if (error?.code === "auth/too-many-requests") {
        setError("Çok fazla deneme. Lütfen daha sonra tekrar deneyin.")
      } else {
        setError("Giriş yapılamadı: " + (error.message || "Bilinmeyen hata"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await handlePostLogin(result.user)
    } catch (error: any) {
      console.error("Google login error:", error)
      if (error?.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error needed usually
      } else {
        setError("Google ile giriş yapılamadı: " + error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!email) {
      setError("Lütfen e-posta adresinizi girin")
      setIsLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess("Şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen gelen kutunuzu ve SPAM/İstenmeyen klasörünü kontrol edin!")
      setShowResetForm(false)
    } catch (error: any) {
      console.error("Password reset error:", error)
      if (error?.code === "auth/user-not-found") {
        setError("Bu e-posta ile kayıtlı hesap bulunamadı")
      } else {
        setError("Şifre sıfırlama e-postası gönderilemedi: " + (error.message || "Bilinmeyen hata"))
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
          <h1 className="text-2xl font-semibold">
            {showResetForm ? "Şifremi Unuttum" : "Giriş Yap"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {showResetForm ? "E-posta adresinize şifre sıfırlama linki göndereceğiz" : "Hesabına giriş yap"}
          </p>
        </div>

        {showResetForm ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Gönderiliyor..." : "Şifre Sıfırlama Linki Gönder"}
            </Button>
            <button
              type="button"
              onClick={() => { setShowResetForm(false); setError(null); setSuccess(null); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Giriş sayfasına dön
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-500">{success}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">veya</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google ile Giriş Yap
            </Button>

            <button
              type="button"
              onClick={() => { setShowResetForm(true); setError(null); setSuccess(null); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Şifremi Unuttum
            </button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Hesabın yok mu?{" "}
          <Link href={`/kayit${followId ? `?follow=${followId}` : ''}`} className="text-foreground underline underline-offset-4">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  )
}
