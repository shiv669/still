"use client"

import Link from "next/link"
import { authClient } from "@/lib/auth/client"
import { StillHeader } from "@/components/still-header"
import { ArrowLeft, LogOut, UserRound } from "lucide-react"

type ProfileUser = { name: string; email: string; image?: string | null }

export function ProfileClient({ user }: { user: ProfileUser }) {
  async function signOut() {
    await authClient.signOut()
    window.location.assign("/auth")
  }

  return (
    <div className="min-h-screen bg-[#030303] text-[#fafafa]">
      <StillHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#888] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Still
        </Link>
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-xl font-semibold">
              {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-7 w-7 text-[#aaa]" />}
            </div>
            <div><h1 className="text-2xl font-semibold">{user.name}</h1><p className="text-sm text-[#888]">{user.email}</p></div>
          </div>
          <div className="pt-6"><button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-[#ddd] hover:bg-white/5"><LogOut className="h-4 w-4" /> Sign out</button></div>
        </section>
      </main>
    </div>
  )
}
