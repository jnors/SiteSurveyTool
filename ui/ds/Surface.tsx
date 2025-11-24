import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const surfaceVariants = cva('rounded-2xl border transition-colors duration-150', {
  variants: {
    tone: {
      base: 'bg-surface border-border shadow-surface',
      raised: 'bg-background border-border shadow-[0_30px_80px_rgba(0,0,0,0.5)]',
      sunken: 'bg-background/80 border-border/60 backdrop-blur-md',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    tone: 'base',
    padding: 'md',
  },
})

export type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof surfaceVariants>

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, tone, padding, ...props }, ref) => (
    <div ref={ref} className={cn(surfaceVariants({ tone, padding, className }))} {...props} />
  ),
)

Surface.displayName = 'Surface'

