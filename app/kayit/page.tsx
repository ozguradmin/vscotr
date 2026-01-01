"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function KayitPage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

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

    // Kullanıcı adı kontrolü
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      setError("Bu kullanıcı adı zaten alınmış")
      setIsLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/${username.toLowerCase()}`,
          data: {
            username: username.toLowerCase(),
            display_name: username,
          },
        },
      })

      if (authError) throw authError

      router.push(`/${username.toLowerCase()}`)
    } catch (error: unknown) {
      console.error("[v0] Signup error:", error)
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
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
