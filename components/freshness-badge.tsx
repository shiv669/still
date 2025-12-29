import type { FreshnessState } from "@/lib/foru-ms/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

interface FreshnessBadgeProps {
  state: FreshnessState
  className?: string
  iconOnly?: boolean // Add iconOnly prop for compact display
}

const STATE_CONFIG = {
  VERIFIED: {
    label: "Verified",
    icon: CheckCircle2,
    className: "freshness-badge-verified",
  },
  POSSIBLY_OUTDATED: {
    label: "Possibly outdated",
    icon: AlertTriangle,
    className: "freshness-badge-possibly-outdated",
  },
  OUTDATED: {
    label: "Outdated",
    icon: XCircle,
    className: "freshness-badge-outdated",
  },
} as const

export function FreshnessBadge({ state, className, iconOnly = false }: FreshnessBadgeProps) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.VERIFIED
  const Icon = config.icon

  if (iconOnly) {
    return (
      <span className={cn("inline-flex items-center", className)} title={config.label}>
        <Icon
          className={cn(
            "h-5 w-5",
            state === "VERIFIED" && "text-emerald-400",
            state === "POSSIBLY_OUTDATED" && "text-yellow-400",
            state === "OUTDATED" && "text-red-400",
          )}
        />
      </span>
    )
  }

  return (
    <span className={cn("freshness-badge", config.className, className)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  )
}
