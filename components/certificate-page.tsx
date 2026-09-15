"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { ArrowLeft, Download, FileImage, FileText, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const STILL_LOGO_URL = "/images/1000103934.png"
const V0_LOGO_URL = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/v0/light.svg"
const VERCEL_LOGO_URL = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/vercel/light.svg"
const DEVPOST_URL = "https://devpost.com/software/still-439yo7"

export function CertificatePage() {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null)

  async function renderCertificate() {
    if (!certificateRef.current) return null
    return html2canvas(certificateRef.current, { scale: 2, useCORS: true, backgroundColor: "#f5f4ef", logging: false })
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
    } finally { setExporting(null) }
  }

  async function downloadPdf() {
    setExporting("pdf")
    try {
      const canvas = await renderCertificate()
      if (!canvas) return
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 297, 210)
      pdf.save("still-featured-winner-certificate.pdf")
    } finally { setExporting(null) }
  }

  return (
    <main className="min-h-screen bg-[#030303] px-4 py-5 text-[#fafafa] sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8a8a8a] transition-colors hover:text-[#fafafa]"><ArrowLeft data-icon="inline-start" /> Back to Still</Link>
          <div className="flex items-center gap-2">
            <Button onClick={downloadPng} disabled={Boolean(exporting)} variant="outline" className="border-[#2a2a2a] bg-[#0a0a0a] text-[#fafafa] hover:bg-[#151515]">{exporting === "png" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <FileImage data-icon="inline-start" />} PNG</Button>
            <Button onClick={downloadPdf} disabled={Boolean(exporting)} className="bg-[#fafafa] text-[#030303] hover:bg-[#e5e5e5]">{exporting === "pdf" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <FileText data-icon="inline-start" />} PDF</Button>
          </div>
        </div>

        <section aria-label="Certificate preview" className="overflow-auto rounded-xl border border-[#1a1a1a] bg-[#080808] p-2 shadow-2xl shadow-black/30 sm:p-5">
          <div ref={certificateRef} className="certificate-shell relative mx-auto aspect-[297/210] w-full min-w-[760px] max-w-[1122px] overflow-hidden bg-[#f5f4ef] text-[#111110]">
            <div className="absolute inset-[2.6%] border border-[#b8b6ae]" />
            <div className="absolute inset-[3.35%] border border-[#dedcd4]" />
            <div className="absolute left-[3.35%] top-[3.35%] h-[15%] w-[11%] border-l border-t border-[#88877f]" />
            <div className="absolute bottom-[3.35%] right-[3.35%] h-[15%] w-[11%] border-b border-r border-[#88877f]" />
            <div className="absolute right-[8%] top-[18%] font-mono text-[clamp(7px,0.72vw,10px)] tracking-[0.32em] text-[#a2a098] [writing-mode:vertical-rl]">STILL / RECOGNITION / 2026</div>

            <div className="relative flex h-full flex-col px-[9%] py-[8%] sm:px-[11%] sm:py-[7.5%]">
              <header className="flex items-start justify-between border-b border-[#d3d1c9] pb-[4%]">
                <div className="flex items-center gap-4">
                  <img src={STILL_LOGO_URL} alt="Still" className="h-9 w-auto object-contain brightness-0 opacity-85 sm:h-11" />
                  <span className="h-7 w-px bg-[#c8c6bd]" />
                  <div className="flex items-center gap-2 text-[#242421]"><img src={V0_LOGO_URL} alt="v0" className="h-4 w-4 object-contain brightness-0" /><span className="font-sans text-[clamp(9px,1vw,13px)] font-semibold tracking-[-0.04em]">v0</span></div>
                </div>
                <div className="flex items-center gap-2 text-[#6e6d67]"><img src={VERCEL_LOGO_URL} alt="Vercel" className="h-3.5 w-3.5 object-contain brightness-0" /><span className="font-mono text-[clamp(7px,0.7vw,10px)] uppercase tracking-[0.2em]">Vercel</span></div>
              </header>

              <div className="my-auto max-w-[76%] py-[3%]">
                <p className="mb-3 font-mono text-[clamp(8px,0.9vw,12px)] font-medium uppercase tracking-[0.34em] text-[#75736b] sm:mb-5">v0 by Vercel Hackathon</p>
                <h1 className="font-sans text-[clamp(2.1rem,6.4vw,5.8rem)] font-semibold leading-[0.86] tracking-[-0.085em] text-[#111110]">FEATURED<br />WINNER</h1>
                <div className="mt-5 h-px w-20 bg-[#171715] sm:mt-8" />
                <p className="mt-4 max-w-[650px] font-sans text-[clamp(0.7rem,1.3vw,1.1rem)] leading-[1.5] text-[#4c4b46] sm:mt-6">Presented in recognition of being selected as a Featured Winner for the project <span className="font-medium text-[#111110]">“Still”</span> in the v0 by Vercel Hackathon.</p>
              </div>

              <div className="grid grid-cols-[0.8fr_1.2fr] gap-8 border-t border-[#c9c7bf] pt-[3.5%] sm:gap-16">
                <div><p className="mb-2 font-mono text-[clamp(7px,0.72vw,10px)] uppercase tracking-[0.28em] text-[#88867e]">Presented to</p><p className="font-sans text-[clamp(1.05rem,2.2vw,1.95rem)] font-medium tracking-[-0.055em] text-[#111110]">Shivam Gawali</p></div>
                <div><p className="mb-2 font-mono text-[clamp(7px,0.72vw,10px)] uppercase tracking-[0.28em] text-[#88867e]">Project / Still</p><p className="max-w-[520px] font-sans text-[clamp(0.62rem,0.95vw,0.84rem)] leading-[1.45] text-[#55544e]">A forum designed to prevent outdated answers from retaining trust by introducing time based answer freshness and community verification.</p></div>
              </div>

              <footer className="mt-[3.5%] grid grid-cols-[1fr_auto] items-end gap-8 border-t border-[#d3d1c9] pt-[2.5%]">
                <div className="min-w-0"><p className="mb-1.5 font-mono text-[clamp(7px,0.7vw,10px)] uppercase tracking-[0.25em] text-[#88867e]">Official verification</p><p className="font-sans text-[clamp(0.57rem,0.82vw,0.72rem)] text-[#5c5b55]">Devpost project submission</p><a href={DEVPOST_URL} target="_blank" rel="noreferrer" className="mt-1 flex min-w-0 items-center gap-1 font-mono text-[clamp(0.52rem,0.72vw,0.65rem)] leading-snug text-[#77756e] underline decoration-[#aaa89f] underline-offset-2"><span className="break-all">{DEVPOST_URL}</span><ExternalLink className="size-3 shrink-0" /></a></div>
                <div className="flex items-center gap-2 pb-1 font-mono text-[clamp(7px,0.7vw,10px)] uppercase tracking-[0.18em] text-[#8d8b83]"><span className="size-1.5 rounded-full bg-[#111110]" /> Featured Winner</div>
              </footer>
            </div>
          </div>
        </section>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-[#666]"><Download data-icon="inline-start" /> Export the exact rendered certificate as a high-resolution image or A4 PDF.</p>
      </div>
    </main>
  )
}
