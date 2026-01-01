import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/ayarlar", "/olustur", "/giris", "/kayit"],
      },
    ],
    sitemap: "https://vscotr.vercel.app/sitemap.xml",
  }
}
