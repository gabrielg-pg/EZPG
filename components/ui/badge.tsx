import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-[#A855F7] focus-visible:ring-2 focus-visible:ring-[#A855F7]/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-all duration-200 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white [a&]:hover:from-[#8B5CF6] [a&]:hover:to-[#A855F7]',
        secondary:
          'border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.1)] text-[#A855F7] [a&]:hover:bg-[rgba(139,92,246,0.2)]',
        destructive:
          'border-transparent bg-destructive/20 text-red-400 [a&]:hover:bg-destructive/30 focus-visible:ring-destructive/20',
        outline:
          'border-[rgba(139,92,246,0.2)] text-foreground bg-transparent [a&]:hover:bg-[rgba(139,92,246,0.1)] [a&]:hover:text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
