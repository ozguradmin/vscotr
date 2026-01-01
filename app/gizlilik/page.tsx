import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"

export default function GizlilikPage() {
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
        <h1 className="text-3xl font-light mb-8">Gizlilik Politikası</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg text-foreground">Son güncelleme: Ocak 2025</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Toplanan Bilgiler</h2>
          <p>VSCO TR, hizmetlerimizi sunabilmek için aşağıdaki bilgileri toplar:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>E-posta adresi (hesap oluşturma için)</li>
            <li>Kullanıcı adı ve profil bilgileri</li>
            <li>Paylaştığınız fotoğraflar ve içerikler</li>
            <li>Kullanım verileri ve çerezler</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. Bilgilerin Kullanımı</h2>
          <p>Topladığımız bilgiler şu amaçlarla kullanılır:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Hesabınızı oluşturmak ve yönetmek</li>
            <li>Hizmetlerimizi sunmak ve geliştirmek</li>
            <li>Güvenlik ve dolandırıcılık önleme</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. Bilgi Paylaşımı</h2>
          <p>Kişisel bilgilerinizi üçüncü taraflarla satmayız. Bilgileriniz yalnızca:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Yasal zorunluluk durumlarında</li>
            <li>Sizin açık onayınızla</li>
            <li>Hizmet sağlayıcılarımızla (veri depolama için)</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. Veri Güvenliği</h2>
          <p>
            Verilerinizin güvenliği için endüstri standardı güvenlik önlemleri kullanıyoruz. Ancak, internet üzerinden
            hiçbir veri iletimi %100 güvenli değildir.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Haklarınız</h2>
          <p>Aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Verilerinize erişim talep etme</li>
            <li>Verilerinizin düzeltilmesini isteme</li>
            <li>Hesabınızı ve verilerinizi silme</li>
            <li>Veri işlemeye itiraz etme</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. İletişim</h2>
          <p>Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz.</p>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm">
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
