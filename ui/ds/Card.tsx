import * as React from 'react'

import { cn } from '@/lib/utils'

import { Surface, type SurfaceProps } from './Surface'

interface CardProps extends SurfaceProps {
  interactive?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone = 'base', padding = 'md', interactive = true, ...props }, ref) => (
    <Surface
      ref={ref}
      tone={tone}
      padding={padding}
      className={cn(
        'relative overflow-hidden',
        interactive && 'hover:border-primary/40 hover:shadow-[0_35px_90px_rgba(0,0,0,0.55)]',
        className,
      )}
      {...props}
    />
  ),
)

Card.displayName = 'DSCard'

