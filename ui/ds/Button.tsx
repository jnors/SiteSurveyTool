"use client"

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'touch-target inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold tracking-tight transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-surface hover:bg-primary/90 active:scale-[0.99]',
        destructive:
          'bg-error text-background hover:bg-error/90 focus-visible:ring-error/60 shadow-surface/80',
        outline:
          'border border-border bg-background/60 text-foreground hover:border-primary/50 hover:text-primary',
        secondary:
          'border border-border bg-surface text-foreground hover:border-primary/40 hover:bg-surface/90',
        ghost:
          'bg-transparent text-foreground hover:bg-white/5 focus-visible:ring-offset-0 focus-visible:ring-0',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-0 focus-visible:ring-offset-0',
      },
      size: {
        default: 'h-11 min-h-[44px] px-5 text-base',
        sm: 'h-10 min-h-[44px] px-4 text-sm',
        lg: 'h-12 min-h-[48px] px-6 text-base',
        icon: 'size-11 min-h-[44px] min-w-[44px] p-0',
        'icon-sm': 'size-10 min-h-[44px] min-w-[44px] p-0',
        'icon-lg': 'size-12 min-h-[48px] min-w-[48px] p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      />
    )
  },
)

Button.displayName = 'DSButton'

