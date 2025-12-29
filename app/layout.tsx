import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
})

export const metadata: Metadata = {
  title: "Still - Where developer answers stay fresh",
  description:
    "A Q&A platform where answers expire unless verified. Built for developers and students who need accurate, up-to-date information.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#030303]">
      <head>
        <link rel="preconnect" href="https://api.foru.ms" />
        <link rel="dns-prefetch" href="https://api.foru.ms" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#030303]`} style={{ backgroundColor: "#030303" }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
