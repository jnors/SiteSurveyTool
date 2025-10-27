'use client'

import { type ChangeEvent, useRef, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

type AddFloorplanButtonProps = {
  onAdd: (file: File) => Promise<{ floorplanId: string }>
  disabled?: boolean
  className?: string
}

export function AddFloorplanButton({ onAdd, disabled, className }: AddFloorplanButtonProps) {
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

  return (
    <>
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}
