import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(255,255,255,0.04)] backdrop-blur-sm px-3 py-1 text-base text-foreground shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-[#A855F7] focus-visible:ring-2 focus-visible:ring-[#A855F7]/20 focus-visible:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        'hover:border-[rgba(139,92,246,0.4)] hover:bg-[rgba(255,255,255,0.06)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
