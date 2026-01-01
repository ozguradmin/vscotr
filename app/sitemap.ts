import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all public profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1000)

  const profileUrls =
    profiles?.map((profile) => ({
      url: `https://vscotr.vercel.app/${profile.username}`,
      lastModified: new Date(profile.updated_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) || []

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
    {
      url: "https://vscotr.vercel.app/hakkinda",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: "https://vscotr.vercel.app/gizlilik",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: "https://vscotr.vercel.app/sartlar",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ]

  return [...staticUrls, ...profileUrls]
}
