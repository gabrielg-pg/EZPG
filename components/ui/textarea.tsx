import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-[rgba(220,38,38,0.2)] placeholder:text-muted-foreground focus-visible:border-[#EF4444] focus-visible:ring-2 focus-visible:ring-[#EF4444]/20 focus-visible:shadow-[0_0_15px_rgba(239,68,68,0.15)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive bg-[rgba(255,255,255,0.04)] backdrop-blur-sm flex field-sizing-content min-h-16 w-full rounded-lg border px-3 py-2 text-base text-foreground shadow-xs transition-all duration-200 outline-none hover:border-[rgba(220,38,38,0.4)] hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
