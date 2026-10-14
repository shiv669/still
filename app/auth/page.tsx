"use client"

import { FormEvent, useState } from "react"
import { ArrowRight, Check, Github, Mail, ShieldCheck } from "lucide-react"
import { authClient } from "@/lib/auth/client"

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in",
      })
      if (result.error) {
        throw new Error(result.error.message || "We could not send a verification code.")
      }
      setSent(true)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "We could not send a verification code."
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      if (result.error) {
        throw new Error(result.error.message || "That verification code is invalid or expired.")
      }
      window.location.assign("/")
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "That verification code is invalid or expired."
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function continueWith(provider: "google" | "github") {
    setError(null)
    const result = await authClient.signIn.social({ provider, callbackURL: "/" })
    if (result.error) setError("That sign-in provider is not configured yet.")
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] px-4 py-10 text-[#fafafa]">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#202020_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-3xl" />
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-white/10 bg-[#101010]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-sm font-semibold">S</div>
            <h1 className="text-xl font-semibold tracking-tight">{mode === "sign-in" ? "Welcome back" : "Join Still"}</h1>
            <p className="mt-2 text-sm leading-6 text-[#888]">{sent ? "Enter the verification code from your email." : "Fresh answers for fast-changing technology."}</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
              <Check className="mx-auto mb-3 h-6 w-6 text-emerald-300" />
              <p className="text-center text-sm text-[#ddd]">We sent a one-time verification code to {email}.</p>
              <form onSubmit={verifyOtp} className="mt-4 space-y-3">
                <label htmlFor="verification-code" className="sr-only">Verification code</label>
                <input id="verification-code" value={otp} onChange={(event) => setOtp(event.target.value)} required inputMode="numeric" autoComplete="one-time-code" placeholder="Enter code" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-center text-sm tracking-[0.35em] outline-none placeholder:text-[#666] placeholder:tracking-normal focus:border-white/30" />
                <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ededed] text-sm font-medium text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60">{busy ? "Verifying…" : "Verify and continue"}<ArrowRight className="h-4 w-4" /></button>
              </form>
              <button className="mt-5 block w-full text-center text-sm text-white underline underline-offset-4" onClick={() => { setSent(false); setOtp(""); setError(null) }}>Use another email</button>
              {error && <p role="alert" className="mt-4 text-center text-xs text-red-300">{error}</p>}
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="space-y-3">
                {mode === "sign-up" && <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm outline-none placeholder:text-[#666] focus:border-white/30" />}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#666]" />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" placeholder="name@work-email.com" className="h-11 w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 text-sm outline-none placeholder:text-[#666] focus:border-white/30" />
                </div>
                <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ededed] text-sm font-medium text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60">{busy ? "Sending link…" : mode === "sign-in" ? "Continue with email" : "Create account"}<ArrowRight className="h-4 w-4" /></button>
              </form>
              <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[#555]"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
              <div className="grid grid-cols-2 gap-3"><button onClick={() => continueWith("google")} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm hover:bg-white/[0.05]">Google</button><button onClick={() => continueWith("github")} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 text-sm hover:bg-white/[0.05]"><Github className="h-4 w-4" />GitHub</button></div>
              <p className="mt-6 text-center text-sm text-[#888]">{mode === "sign-in" ? "New to Still?" : "Already have an account?"} <button onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null) }} className="text-white underline underline-offset-4">{mode === "sign-in" ? "Sign up" : "Sign in"}</button></p>
              {error && <p role="alert" className="mt-4 text-center text-xs text-red-300">{error}</p>}
            </>
          )}
          <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#666]"><ShieldCheck className="h-3.5 w-3.5" /> Passwordless and securely managed by Neon Auth.</div>
        </div>
      </section>
    </main>
  )
}
