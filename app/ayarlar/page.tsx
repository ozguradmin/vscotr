import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/settings-view"

export default async function AyarlarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/giris")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: links } = await supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", user.id)
    .order("order_index", { ascending: true })

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("order_index", { ascending: true })

  return (
    <SettingsView
      profile={profile}
      links={links || []}
      posts={posts || []}
      userId={user.id}
      userEmail={user.email || ""}
    />
  )
}
