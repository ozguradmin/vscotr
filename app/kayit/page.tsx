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
              onChange={(e) => setPassword(e.target.value)}
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
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
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
