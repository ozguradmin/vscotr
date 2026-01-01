import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"

export default function HakkindaPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <VscoLogo className="w-8 h-8" />
            <span className="font-semibold">VSCO TR</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-light mb-8">Hakkında</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-lg">
            <strong>VSCO TR</strong>, fotoğraf paylaşımı ve düzenleme için oluşturulmuş tamamen ücretsiz bir VSCO
            alternatifidir.
          </p>

          <h2 className="text-xl font-semibold mt-8">Özellikler</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Ücretsiz profil oluşturma ve fotoğraf paylaşma</li>
            <li>VSCO tarzı fotoğraf filtreleri ve düzenleme araçları</li>
            <li>Kullanıcı takip sistemi ve akış</li>
            <li>Repost özelliği</li>
            <li>Mobil uyumlu tasarım</li>
            <li>Tamamen ücretsiz kullanım</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">Geliştirici</h2>
          <p className="text-muted-foreground">
            VSCO TR, <strong>Özgür Güler</strong> tarafından geliştirilmiştir. Bu proje, yaratıcı topluluğa ücretsiz bir
            platform sunmak amacıyla oluşturulmuştur.
          </p>

          <h2 className="text-xl font-semibold mt-8">Açık Kaynak</h2>
          <p className="text-muted-foreground">
            Bu platform, topluluk katkılarına açıktır. Geliştirme sürecine katkıda bulunmak veya geri bildirim sağlamak
            için iletişime geçebilirsiniz.
          </p>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              © 2025 VSCO TR. Tüm hakları saklıdır.
              <br />
              Özgür Güler tarafından geliştirildi.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
