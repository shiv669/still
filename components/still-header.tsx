"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

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
            <Link href="/certificate">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-[#2a2a2a] bg-transparent px-3 text-xs text-[#fafafa] hover:bg-[#151515] sm:h-9 sm:px-4 sm:text-sm"
              >
                Certificate
              </Button>
            </Link>
            <Link href="/questions/new">
              <Button
                size="sm"
                className="h-8 rounded-full bg-[#fafafa] px-3 text-xs text-[#030303] hover:bg-[#e5e5e5] sm:h-9 sm:px-4 sm:text-sm"
              >
                Ask Question
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
