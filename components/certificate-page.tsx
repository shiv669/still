"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { ArrowLeft, Download, FileImage, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const LOGO_URL = "/images/1000103934.png"
const DEVPOST_URL = "https://devpost.com/software/still-439yo7"

export function CertificatePage() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null)

  async function renderCertificate() {
    if (!certificateRef.current) return null
    return html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#080808",
      logging: false,
    })
  }

  async function downloadPng() {
    setExporting("png")
    try {
      const canvas = await renderCertificate()
      if (!canvas) return
      const link = document.createElement("a")
      link.download = "still-featured-winner-certificate.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    } finally {
      setExporting(null)
    }
  }

  async function downloadPdf() {
    setExporting("pdf")
    try {
      const canvas = await renderCertificate()
      if (!canvas) return
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210)
      pdf.save("still-featured-winner-certificate.pdf")
    } finally {
      setExporting(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#030303] px-4 py-5 text-[#fafafa] sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8a8a8a] transition-colors hover:text-[#fafafa]">
            <ArrowLeft data-icon="inline-start" /> Back to Still
          </Link>
          <div className="flex items-center gap-2">
            <Button onClick={downloadPng} disabled={Boolean(exporting)} variant="outline" className="border-[#2a2a2a] bg-[#0a0a0a] text-[#fafafa] hover:bg-[#151515]">
              {exporting === "png" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <FileImage data-icon="inline-start" />}
              PNG
            </Button>
            <Button onClick={downloadPdf} disabled={Boolean(exporting)} className="bg-[#fafafa] text-[#030303] hover:bg-[#e5e5e5]">
              {exporting === "pdf" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <FileText data-icon="inline-start" />}
              PDF
            </Button>
          </div>
        </div>

        <section aria-label="Certificate preview" className="flex justify-center overflow-hidden rounded-xl border border-[#1a1a1a] bg-[#080808] p-2 shadow-2xl shadow-black/30 sm:p-5">
          <div ref={certificateRef} className="certificate-shell relative aspect-[297/210] w-full max-w-[1122px] overflow-hidden bg-[#080808] text-[#f5f5f0]">
            <div className="absolute inset-[2.2%] border border-[#343434]" />
            <div className="absolute inset-[3.2%] border border-[#171717]" />
            <div className="absolute left-[3.2%] top-[3.2%] h-20 w-20 border-l border-t border-[#7d7d72] sm:h-28 sm:w-28" />
            <div className="absolute bottom-[3.2%] right-[3.2%] h-20 w-20 border-b border-r border-[#7d7d72] sm:h-28 sm:w-28" />

            <div className="relative flex h-full flex-col px-[9%] py-[8%] sm:px-[11%] sm:py-[7.5%]">
              <div className="flex items-start justify-between">
                <img src={LOGO_URL} alt="Still" className="h-7 w-auto object-contain opacity-90 sm:h-10" />
                <div className="text-right font-mono text-[7px] uppercase tracking-[0.22em] text-[#77776f] sm:text-[9px]">Official recognition / 2026</div>
              </div>

              <div className="my-auto max-w-[760px]">
                <p className="mb-3 font-mono text-[8px] font-medium uppercase tracking-[0.35em] text-[#8b8b82] sm:mb-5 sm:text-[11px]">v0 by Vercel Hackathon</p>
                <h1 className="font-sans text-[clamp(2rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.07em] text-[#fafaf5]">FEATURED<br />WINNER</h1>
                <div className="mt-5 h-px w-14 bg-[#d8d8cc] sm:mt-8 sm:w-20" />
                <p className="mt-4 max-w-[590px] font-sans text-[clamp(0.72rem,1.35vw,1.1rem)] leading-relaxed text-[#b6b6ae] sm:mt-6">
                  Presented in recognition of being selected as a Featured Winner for the project <span className="text-[#f5f5f0]">“Still”</span> in the v0 by Vercel Hackathon.
                </p>
              </div>

              <div className="grid grid-cols-[1.2fr_1fr] items-end gap-6 border-t border-[#292929] pt-4 sm:gap-12 sm:pt-6">
                <div>
                  <p className="mb-1 font-mono text-[7px] uppercase tracking-[0.28em] text-[#72726b] sm:text-[9px]">Presented to</p>
                  <p className="font-sans text-[clamp(1rem,2.1vw,1.8rem)] font-medium tracking-[-0.04em] text-[#fafaf5]">Shivam Gawali</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 font-mono text-[7px] uppercase tracking-[0.28em] text-[#72726b] sm:text-[9px]">Project / Still</p>
                  <p className="line-clamp-2 font-sans text-[clamp(0.62rem,1vw,0.86rem)] leading-snug text-[#a8a8a0]">A forum designed to prevent outdated answers from retaining trust by introducing time based answer freshness and community verification.</p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4 sm:mt-6">
                <div className="min-w-0">
                  <p className="mb-1 font-mono text-[7px] uppercase tracking-[0.25em] text-[#72726b] sm:text-[9px]">Verification</p>
                  <p className="truncate text-[clamp(0.5rem,0.9vw,0.75rem)] text-[#92928b]">Official verification: Devpost project submission</p>
                  <a href={DEVPOST_URL} target="_blank" rel="noreferrer" className="mt-1 block truncate font-mono text-[clamp(0.45rem,0.8vw,0.68rem)] text-[#77776f] underline decoration-[#4a4a43] underline-offset-2">{DEVPOST_URL}</a>
                </div>
                <div className="shrink-0 text-right font-mono text-[7px] uppercase tracking-[0.18em] text-[#6f6f68] sm:text-[9px]">Still / v0</div>
              </div>
            </div>
          </div>
        </section>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-[#666]"><Download data-icon="inline-start" /> Export the exact rendered certificate as a high-resolution image or A4 PDF.</p>
      </div>
    </main>
  )
}
