"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/client"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Suspense } from "react"

function PasswordResetContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [email, setEmail] = useState<string | null>(null)
    const [isValidCode, setIsValidCode] = useState<boolean | null>(null)

    const oobCode = searchParams.get("oobCode")
    const mode = searchParams.get("mode")

    useEffect(() => {
        const verifyCode = async () => {
            if (!oobCode || mode !== "resetPassword") {
                setError("Geçersiz veya eksik şifre sıfırlama kodu.")
                setIsValidCode(false)
                return
            }

            try {
                const userEmail = await verifyPasswordResetCode(auth, oobCode)
                setEmail(userEmail)
                setIsValidCode(true)
            } catch (error: any) {
                console.error("Code verification error:", error)
                if (error?.code === "auth/expired-action-code") {
                    setError("Şifre sıfırlama linkinizin süresi dolmuş. Lütfen yeni bir link talep edin.")
                } else if (error?.code === "auth/invalid-action-code") {
                    setError("Geçersiz şifre sıfırlama linki. Bu link daha önce kullanılmış olabilir.")
                } else {
                    setError("Şifre sıfırlama linki doğrulanamadı.")
                }
                setIsValidCode(false)
            }
        }

        verifyCode()
    }, [oobCode, mode])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (newPassword.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Şifreler eşleşmiyor.")
            return
        }

        if (!oobCode) {
            setError("Geçersiz şifre sıfırlama kodu.")
            return
        }

        setIsLoading(true)

        try {
            await confirmPasswordReset(auth, oobCode, newPassword)
            setSuccess(true)
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/giris")
            }, 3000)
        } catch (error: any) {
            console.error("Password reset error:", error)
            if (error?.code === "auth/expired-action-code") {
                setError("Şifre sıfırlama linkinizin süresi dolmuş. Lütfen yeni bir link talep edin.")
            } else if (error?.code === "auth/weak-password") {
                setError("Şifre çok zayıf. Daha güçlü bir şifre seçin.")
            } else {
                setError("Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (isValidCode === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Doğrulanıyor...</p>
                </div>
            </div>
        )
    }

    if (!isValidCode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <div className="w-full max-w-sm space-y-6 text-center">
                    <VscoLogo className="h-10 w-10 mx-auto" />
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                        <p className="text-red-500 text-sm">{error}</p>
                    </div>
                    <Link href="/giris">
                        <Button className="w-full mt-4">Giriş Sayfasına Dön</Button>
                    </Link>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <div className="w-full max-w-sm space-y-6 text-center">
                    <VscoLogo className="h-10 w-10 mx-auto" />
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <p className="text-green-500 font-medium">Şifreniz başarıyla güncellendi!</p>
                        <p className="text-muted-foreground text-sm mt-2">
                            Giriş sayfasına yönlendiriliyorsunuz...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <VscoLogo className="h-10 w-10 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Yeni Şifre Belirle</h1>
                    {email && (
                        <p className="text-muted-foreground text-sm mt-2">
                            {email} için yeni şifre
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Yeni Şifre</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            placeholder="En az 6 karakter"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Şifreyi Onayla</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Şifrenizi tekrar girin"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-red-500 text-sm">{error}</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/giris" className="text-foreground underline underline-offset-4">
                        Giriş sayfasına dön
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function PasswordResetPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full"></div>
            </div>
        }>
            <PasswordResetContent />
        </Suspense>
    )
}
