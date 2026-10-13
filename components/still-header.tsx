import Link from "next/link"
const LOGO_URL = "/images/1000103934.png"

export function StillHeader() {
  return (
    <header className="border-b border-[#1a1a1a] bg-[#030303]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={LOGO_URL || "/placeholder.svg"} alt="Still" className="h-8 sm:h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth" className="rounded-full px-3 py-2 text-xs text-[#aaa] transition hover:bg-white/[0.06] hover:text-white sm:text-sm">
              Sign in
            </Link>
            <Link
              href="/questions/new"
              className="inline-flex h-8 items-center justify-center rounded-full bg-[#fafafa] px-3 text-xs text-[#030303] transition-colors hover:bg-[#e5e5e5] sm:h-9 sm:px-4 sm:text-sm"
            >
              Ask Question
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
