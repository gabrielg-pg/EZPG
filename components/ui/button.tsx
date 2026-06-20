import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0809] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-[#B91C1C] to-[#DC2626] text-white hover:from-[#DC2626] hover:to-[#EF4444] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-[0.98]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] focus-visible:ring-destructive/50',
        outline:
          'border border-[rgba(220,38,38,0.3)] bg-transparent text-foreground shadow-xs hover:bg-[rgba(220,38,38,0.1)] hover:border-[rgba(220,38,38,0.5)] hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]',
        secondary:
          'bg-[rgba(255,255,255,0.06)] text-secondary-foreground border border-[rgba(220,38,38,0.15)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(220,38,38,0.3)]',
        ghost:
          'hover:bg-[rgba(220,38,38,0.1)] hover:text-accent-foreground bg-transparent',
        link: 'text-primary underline-offset-4 hover:underline bg-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-lg px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
