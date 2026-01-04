"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, db, COLLECTIONS } from "@/lib/firebase/client"
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"

export default function KayitPage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const followId = searchParams.get('follow')
  const { refreshUser, logout } = useAuth()

  const handlePostLogin = async (user: any) => {
    // 5. Refresh Context
    await refreshUser()

    // Auto-follow logic
    if (followId && followId !== user.uid) {
      try {
        // Check if already following
        const followsRef = collection(db, COLLECTIONS.FOLLOWS)
        const q = query(followsRef,
          where('follower_id', '==', user.uid),
          where('following_id', '==', followId)
        )
        const checkSnapshot = await getDocs(q)

        if (checkSnapshot.empty) {
          await addDoc(collection(db, COLLECTIONS.FOLLOWS), {
            follower_id: user.uid,
            following_id: followId,
            created_at: new Date()
          })
        }

        // Fetch target profile to redirect
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

    // Check if profile exists (for Google login case)
    const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, user.uid))
    if (profileDoc.exists() && profileDoc.data().username) {
      router.push(`/${profileDoc.data().username}`)
    } else {
      router.push("/ayarlar")
    }
  }

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

    try {
      // 1. Check Username Uniqueness
      const profilesRef = collection(db, COLLECTIONS.PROFILES)
      const q = query(profilesRef, where("username", "==", username.toLowerCase()))
      const existingUsers = await getDocs(q)

      if (!existingUsers.empty) {
        setError("Bu kullanıcı adı zaten alınmış")
        setIsLoading(false)
        return
      }

      // 2. Create Account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user

      // 3. Update display name
      await updateProfile(newUser, { displayName: username })

      // 4. Create Profile Document in Firestore
      await setDoc(doc(db, COLLECTIONS.PROFILES, newUser.uid), {
        username: username.toLowerCase(),
        display_name: username,
        avatar_url: null,
        bio: null,
        member_badge: null,
        location: null,
        grid_sort: null,
        grid_filter: null,
        created_at: new Date(),
        updated_at: new Date()
      })

      await handlePostLogin(newUser)

    } catch (error: any) {
      console.error("[Register] Signup error:", error)
      if (error?.code === "auth/weak-password") {
        setError("Şifre en az 6 karakter olmalıdır")
      } else if (error?.code === "auth/email-already-in-use") {
        setError("Bu e-posta adresi ile zaten bir hesap mevcut")
      } else if (error?.code === "auth/invalid-email") {
        setError("Geçersiz e-posta adresi")
      } else {
        setError(error.message || "Bir hata oluştu")
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
        // Ignore
      } else {
        setError("Google ile kayıt yapılamadı: " + error.message)
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

        <div className="relative my-4">
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
          Google ile Kayıt Ol
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Zaten hesabın var mı?{" "}
          <Link href={`/giris${followId ? `?follow=${followId}` : ''}`} className="text-foreground underline underline-offset-4">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
