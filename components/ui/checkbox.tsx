'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-[rgba(139,92,246,0.3)] bg-[rgba(255,255,255,0.04)] data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#8B5CF6] data-[state=checked]:text-white data-[state=checked]:border-transparent focus-visible:border-[#A855F7] focus-visible:ring-2 focus-visible:ring-[#A855F7]/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive size-4 shrink-0 rounded-[5px] border shadow-xs transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:border-[rgba(139,92,246,0.5)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
