import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateView } from "@/components/create-view"

export default async function OlusturPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/giris")
  }

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

  return <CreateView userId={user.id} username={profile?.username || ""} />
}
