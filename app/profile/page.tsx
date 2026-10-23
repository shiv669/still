import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/server"
import { ProfileClient } from "@/components/profile-client"

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/auth?redirect=/profile")
  return <ProfileClient user={session.user} />
}
