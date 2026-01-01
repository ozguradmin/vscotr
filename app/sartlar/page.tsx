import Link from "next/link"
import { VscoLogo } from "@/components/vsco-logo"

export default function SartlarPage() {
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
        <h1 className="text-3xl font-light mb-8">Hizmet Şartları</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg text-foreground">Son güncelleme: Ocak 2025</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Kabul</h2>
          <p>
            VSCO TR'yi kullanarak bu hizmet şartlarını kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız, lütfen
            hizmetlerimizi kullanmayın.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. Hizmet Tanımı</h2>
          <p>
            VSCO TR, kullanıcıların fotoğraf paylaşmasına, düzenlemesine ve diğer kullanıcılarla etkileşimde bulunmasına
            olanak tanıyan ücretsiz bir platformdur. Bu hizmet, VSCO'nun resmi bir ürünü değildir ve bağımsız olarak
            geliştirilmiştir.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. Kullanıcı Sorumlulukları</h2>
          <p>Kullanıcılar aşağıdaki kurallara uymayı kabul eder:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Yalnızca sahip olduğunuz veya paylaşım hakkına sahip olduğunuz içerikleri yüklemek</li>
            <li>Yasa dışı, zararlı veya rahatsız edici içerik paylaşmamak</li>
            <li>Diğer kullanıcıların haklarına saygı göstermek</li>
            <li>Platformu kötüye kullanmamak</li>
            <li>Hesap bilgilerinizi güvende tutmak</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. İçerik Hakları</h2>
          <p>
            Paylaştığınız içeriklerin tüm hakları size aittir. VSCO TR'ye içerik yükleyerek, platformda gösterilmesi
            için gerekli lisansı vermiş olursunuz. İçeriğinizi istediğiniz zaman silebilirsiniz.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Ücretlendirme</h2>
          <p>
            VSCO TR tamamen ücretsiz bir hizmettir. Şu anda veya gelecekte herhangi bir ücret talep etme planımız
            bulunmamaktadır. Bu, gerçek VSCO'dan farklı olarak, tüm özelliklere ücretsiz erişim sağladığınız anlamına
            gelir.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Sorumluluk Reddi</h2>
          <p>
            VSCO TR "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz veya hatasız olacağını garanti etmiyoruz. Veri
            kaybı veya diğer zararlardan sorumlu tutulamayız.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">7. Hesap Feshi</h2>
          <p>
            Bu şartları ihlal eden hesapları önceden bildirimde bulunmaksızın askıya alma veya silme hakkını saklı
            tutarız.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">8. Değişiklikler</h2>
          <p>
            Bu hizmet şartlarını herhangi bir zamanda değiştirme hakkını saklı tutarız. Önemli değişiklikler platformda
            duyurulacaktır.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">9. İletişim</h2>
          <p>Hizmet şartlarıyla ilgili sorularınız için bizimle iletişime geçebilirsiniz.</p>

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
