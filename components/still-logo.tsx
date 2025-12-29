"use client"

const LOGO_URL = "/images/1000103934.png"

interface StillLogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function StillLogo({ className = "", size = 120, showText = true }: StillLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={LOGO_URL || "/placeholder.svg"}
        alt="Still logo"
        width={size}
        height={showText ? size * 1.2 : size * 0.75}
        className="object-contain"
        style={{
          objectPosition: showText ? "center" : "center top",
          height: showText ? size * 1.2 : size * 0.75,
        }}
      />
    </div>
  )
}

// Icon-only version (just the S mark, no text)
export function StillLogoMark({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={LOGO_URL || "/placeholder.svg"}
      alt="Still"
      width={size}
      height={size}
      className={`object-cover object-[center_25%] ${className}`}
      style={{
        clipPath: "inset(0 0 40% 0)",
        height: size,
        width: size,
      }}
    />
  )
}
