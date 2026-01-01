import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function KayitBasariliPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <VscoLogo className="w-12 h-12 mx-auto" />
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Kayıt Başarılı!</CardTitle>
            <CardDescription>E-postanı kontrol et</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Başarıyla kayıt oldun. Hesabını doğrulamak için lütfen e-postanı kontrol et ve doğrulama linkine tıkla.
            </p>
            <Link href="/giris" className="block mt-4 text-center text-sm underline underline-offset-4">
              Giriş sayfasına dön
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
