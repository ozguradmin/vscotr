import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls = [
    {
      url: "https://vscotr.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://vscotr.vercel.app/akis",
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
    {
      url: "https://vscotr.vercel.app/kesfet",
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
    // Add other static pages...
  ]

  return [...staticUrls]
}
