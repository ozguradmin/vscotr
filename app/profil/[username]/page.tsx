import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function OldProfileRedirect({ params }: PageProps) {
  const { username } = await params
  redirect(`/${username}`)
}
