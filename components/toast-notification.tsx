"use client"

import { useEffect, useState } from "react"

import { Toast } from "@/ui/ds/Toast"

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
    return undefined
  }, [show, duration, onClose])

  if (!show && !isVisible) return null

  return (
    <div
      className={`fixed top-20 left-1/2 z-50 flex -translate-x-1/2 transition-all duration-150 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
    >
      <Toast
        tone="success"
        description={message}
        onClose={() => {
          setIsVisible(false)
          setTimeout(onClose, 150)
        }}
      />
    </div>
  )
}
