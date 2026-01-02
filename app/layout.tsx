import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CacheProvider } from "@/lib/cache-context"
import { AuthProvider } from "@/lib/auth-context"
import { ClientLayout } from "@/components/client-layout"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://vscotr.vercel.app"),
  title: {
    default: "VSCO TR - Ücretsiz VSCO Alternatifi | Fotoğraf Paylaşım Platformu",
    template: "%s | VSCO TR",
  },
  description:
    "VSCO TR, fotoğraflarınızı paylaşabileceğiniz, keşfedebileceğiniz ve diğer kullanıcılarla bağlantı kurabileceğiniz ücretsiz bir fotoğraf paylaşım platformudur. Özgür Güler tarafından geliştirilmiştir.",
  keywords: [
    "vsco",
    "fotoğraf paylaşımı",
    "sosyal medya",
    "fotoğraf",
    "galeri",
    "türkiye",
    "ücretsiz vsco",
    "vsco alternatifi",
  ],
  authors: [{ name: "Özgür Güler" }],
  creator: "Özgür Güler",
  publisher: "VSCO TR",
  generator: "v0.app",
  applicationName: "VSCO TR",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://vscotr.vercel.app",
    siteName: "VSCO TR",
    title: "VSCO TR - Ücretsiz VSCO Alternatifi | Fotoğraf Paylaşım Platformu",
    description:
      "Fotoğraflarınızı paylaşın, keşfedin ve bağlanın. Özgür Güler tarafından geliştirilen ücretsiz VSCO alternatifi.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VSCO TR - Fotoğraf Paylaşım Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VSCO TR - Ücretsiz VSCO Alternatifi",
    description: "Fotoğraflarınızı paylaşın, keşfedin ve bağlanın.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <CacheProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </CacheProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
