import React from "react"
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-[rgba(139,92,246,0.1)] animate-pulse rounded-lg', className)}
      {...props}
    />
  )
}

export { Skeleton }
