"use client"

import { CreateView } from "@/components/create-view"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function OlusturPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/giris")
    }
  }, [user, loading, router])

  if (loading) return null // or spinner

  if (!user) return null

  return <CreateView userId={user.$id} username={user.name} />
}
