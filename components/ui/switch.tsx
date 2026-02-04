'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#7C3AED] data-[state=checked]:to-[#8B5CF6] data-[state=unchecked]:bg-[rgba(255,255,255,0.1)] focus-visible:border-[#A855F7] focus-visible:ring-2 focus-visible:ring-[#A855F7]/20 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-[rgba(139,92,246,0.3)] shadow-xs transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={
          'bg-white data-[state=checked]:bg-white pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 shadow-sm'
        }
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
