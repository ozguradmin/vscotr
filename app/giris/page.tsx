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
      setSuccess("Şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.")
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
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
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
