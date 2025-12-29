"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { FeaturedQuestion } from "./featured-question"
import type { ForumsThread } from "@/lib/foru-ms/client"

const LOGO_URL = "/images/1000103934.png"

interface StillHeroProps {
  featuredThread?: ForumsThread | null
  isLoading?: boolean
}

export function StillHero({ featuredThread, isLoading }: StillHeroProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create question")
      }

      router.push(`/questions/${data.thread.id}`)
    } catch (error: any) {
      alert(`Failed to create question: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-6 sm:pt-10 px-4 lg:px-0 flex mx-auto max-w-6xl flex-col items-center justify-center text-center">
      <div className="grid w-full border-0 border-b md:border border-[#1a1a1a] relative grid-cols-10">
        {/* Gradient background */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            background: "radial-gradient(80% 100% at 0% 100%, #22c55e 0%, #030303 50%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 60%)",
            maskImage: "linear-gradient(to top, black 0%, transparent 60%)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        />

        {/* Corner decorations */}
        <Plus size={24} strokeWidth={0.8} className="absolute -top-3 -left-3 text-[#2a2a2a] hidden md:block" />
        <Plus size={24} strokeWidth={0.8} className="absolute -bottom-3 -right-3 text-[#2a2a2a] hidden md:block" />

        {/* Left grid column */}
        <div className="md:grid hidden w-full col-span-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="border-b border-[#1a1a1a] last:border-0 flex-1 aspect-square" />
          ))}
        </div>

        {/* Main content area */}
        <div className="md:col-span-8 col-span-10">
          {/* Top grid row */}
          <div className="md:flex hidden">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="border-l border-[#1a1a1a] last:border-r flex-1 aspect-square" />
            ))}
          </div>

          {isLoading ? (
            <div className="relative w-full border border-[#1a1a1a] -mt-0.5 p-4 sm:p-6 md:p-8">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-32 bg-[#1a1a1a] rounded" />
                </div>
                <div className="h-5 w-3/4 bg-[#1a1a1a] rounded" />
                <div className="h-4 w-full bg-[#1a1a1a] rounded" />
                <div className="space-y-3 mt-4">
                  <div className="p-3 border border-[#1a1a1a] rounded-lg">
                    <div className="h-4 w-full bg-[#1a1a1a] rounded mb-2" />
                    <div className="h-3 w-1/3 bg-[#1a1a1a] rounded" />
                  </div>
                </div>
              </div>
            </div>
          ) : featuredThread ? (
            <div className="relative w-full border border-[#1a1a1a] -mt-0.5 p-4 sm:p-6 md:p-8">
              <FeaturedQuestion thread={featuredThread} />
            </div>
          ) : null}

          <div className="flex">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="border-l border-[#1a1a1a] last:border-r border-b flex-1 aspect-[2/1]" />
            ))}
          </div>

          <div className="relative w-full border-x border-[#1a1a1a] flex items-center flex-col justify-center p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-3">
              <div className="text-center mb-3">
                <h2 className="text-sm sm:text-base font-medium text-[#fafafa]">Ask a New Question</h2>
              </div>

              <Input
                placeholder="What's your question?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#666666] focus:border-[#fafafa] focus:ring-0 h-10 text-sm"
              />

              <Textarea
                placeholder="Add details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={2}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#666666] focus:border-[#fafafa] focus:ring-0 resize-none text-sm"
              />

              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full rounded-full bg-[#fafafa] text-[#030303] hover:bg-[#e5e5e5] h-10 font-medium text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Ask Question"
                )}
              </Button>
            </form>
          </div>

          {/* Logo section */}
          <div className="relative w-full h-full">
            <div className="absolute z-10 top-12 sm:top-16 md:top-20 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <img
                src={LOGO_URL || "/placeholder.svg"}
                alt="Still logo"
                className="h-20 sm:h-28 md:h-36 w-auto object-contain"
              />
            </div>

            {/* Bottom grid rows */}
            <div className="flex">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="border-l border-[#1a1a1a] last:border-r border-b flex-1 aspect-square" />
              ))}
            </div>
            <div className="flex">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="border-l border-[#1a1a1a] border-b last:border-r flex-1 aspect-square" />
              ))}
            </div>
            <div className="flex">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="border-l border-[#1a1a1a] last:border-r flex-1 aspect-square" />
              ))}
            </div>
          </div>
        </div>

        {/* Right grid column */}
        <div className="md:grid hidden col-span-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="border-b border-[#1a1a1a] last:border-b-0 flex-1 aspect-square" />
          ))}
        </div>
      </div>
    </div>
  )
}
