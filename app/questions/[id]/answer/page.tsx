"use client"

import type React from "react"
import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StillHeader } from "@/components/still-header"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function NewAnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/threads/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error("Failed to create answer")
      }

      router.push(`/questions/${id}`)
    } catch (error) {
      console.error("[v0] Failed to create answer:", error)
      alert("Failed to create answer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303]">
      <StillHeader />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href={`/questions/${id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#666666] hover:text-[#fafafa] transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to question
        </Link>

        <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#fafafa]">Write Your Answer</h1>
            <p className="text-xs sm:text-sm text-[#666666] mt-2">
              Your answer will require community verification to stay valid over time.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-[#fafafa]">
                Answer
              </Label>
              <Textarea
                id="content"
                placeholder="Provide a detailed, accurate answer..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={12}
                className="bg-[#030303] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#666666] focus:border-[#fafafa] focus:ring-0 resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
              <Link href={`/questions/${id}`} className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[#666666] hover:text-[#fafafa] hover:bg-[#1a1a1a]"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-full bg-[#fafafa] text-[#030303] hover:bg-[#e5e5e5] min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
