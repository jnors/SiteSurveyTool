"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, X } from "lucide-react"

interface ToastNotificationProps {
  message: string
  show: boolean
  onClose: () => void
  duration?: number
}

export function ToastNotification({ message, show, onClose, duration = 3000 }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 150) // Wait for fade out animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show && !isVisible) return null

  return (
    <div
      className={`
        fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-green-600/50 bg-background-card px-4 py-3 shadow-xl transition-all duration-150
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
      `}
    >
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <p className="text-foreground text-sm">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 150)
        }}
        className="text-foreground-muted transition-colors hover:text-foreground"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
