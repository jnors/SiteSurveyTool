'use client'

import { type ChangeEvent, useRef, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type AddFloorplanButtonProps = {
  onAdd: (file: File) => Promise<{ floorplanId: string }>
  disabled?: boolean
  disabledReason?: string
  className?: string
}

export function AddFloorplanButton({ onAdd, disabled, disabledReason, className }: AddFloorplanButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handlePick = () => {
    if (disabled || isUploading) return
    inputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      await onAdd(file)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const showTooltip = (disabled || isUploading) && Boolean(disabledReason)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              className={className}
              disabled={disabled || isUploading}
              onClick={handlePick}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  Compressing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Floorplan
                </>
              )}
            </Button>
          </span>
        </TooltipTrigger>
        {showTooltip ? <TooltipContent>{disabledReason}</TooltipContent> : null}
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </>
  )
}
