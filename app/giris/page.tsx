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
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

export default function GirisPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const followId = searchParams.get('follow')
  const { refreshUser } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

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
        router.push(`/akis`)
      } else {
        router.push("/ayarlar")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
        setError("Geçersiz e-posta veya şifre")
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <VscoLogo className="w-12 h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-semibold">Giriş Yap</h1>
          <p className="text-sm text-muted-foreground mt-2">Hesabına giriş yap</p>
        </div>

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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>

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
