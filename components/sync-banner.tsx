"use client"

import { useEffect, useState } from "react"
import type { SyncStatus } from "@/lib/types"
import { getSyncStatusColor, getSyncStatusText } from "@/lib/utils/sync-status"
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react"

interface SyncBannerProps {
  status: SyncStatus
}

export function SyncBanner({ status }: SyncBannerProps) {
  const [prevStatus, setPrevStatus] = useState<SyncStatus>(status)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (prevStatus !== status) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setPrevStatus(status)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [status, prevStatus])

  const getIcon = () => {
    switch (status) {
      case "synced":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "syncing":
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  const getAnimationClass = () => {
    switch (status) {
      case "synced":
        return "animate-[subtle-pulse_2s_ease-in-out_infinite]"
      case "pending":
        return ""
      case "error":
        return "animate-[shake_150ms_ease-in-out]"
      case "syncing":
        return ""
      default:
        return ""
    }
  }

  return (
    <div
      className={`
        flex items-center justify-center gap-2 px-4 py-2 
        ${getSyncStatusColor(status)} 
        ${getAnimationClass()}
        transition-all duration-150 ease-in-out
        animate-[slide-down_150ms_ease-out]
      `}
    >
      <span className="text-black">{getIcon()}</span>
      <span className="font-medium text-black text-sm">{getSyncStatusText(status)}</span>
    </div>
  )
}
