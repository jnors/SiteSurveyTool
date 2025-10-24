"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddPinButtonProps {
  onClick: () => void
  disabled?: boolean
  disabledReason?: string
  isActive?: boolean
}

export function AddPinButton({ onClick, disabled = false, disabledReason, isActive = false }: AddPinButtonProps) {
  const tooltipText = disabled ? disabledReason ?? "Action unavailable" : "Add Pin"

  return (
    <div className="group relative">
      <Button
        onClick={onClick}
        disabled={disabled}
        size="lg"
        className={`
          fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-150
          ${
            isActive
              ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "bg-primary hover:bg-primary/90"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : "hover:scale-105 hover:shadow-xl"}
          sm:h-16 sm:w-16
        `}
        aria-label="Add Pin"
      >
        <Plus className={`h-6 w-6 transition-transform duration-150 ${isActive ? "rotate-45" : ""}`} />
      </Button>

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-background-elevated px-3 py-1.5 text-foreground text-sm opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {tooltipText}
      </div>
    </div>
  )
}
