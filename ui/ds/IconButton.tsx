"use client"

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const iconButtonVariants = cva(
  'touch-target inline-flex items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      tone: {
        subtle: 'border-border bg-surface text-foreground hover:border-primary/40 hover:text-primary',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-white/5',
        primary: 'border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90',
      },
      size: {
        sm: 'h-10 w-10 min-h-[40px] min-w-[40px]',
        md: 'h-11 w-11 min-h-[44px] min-w-[44px]',
        lg: 'h-12 w-12 min-h-[48px] min-w-[48px]',
      },
    },
    defaultVariants: {
      tone: 'subtle',
      size: 'md',
    },
  },
)

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants>

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ tone, size, className }))}
      {...props}
    />
  ),
)

IconButton.displayName = 'IconButton'

export { iconButtonVariants }

