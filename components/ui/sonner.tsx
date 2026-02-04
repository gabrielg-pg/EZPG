'use client'

import React from "react"

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'rgba(14, 17, 24, 0.95)',
          '--normal-text': '#F1F5F9',
          '--normal-border': 'rgba(139, 92, 246, 0.2)',
        } as React.CSSProperties
      }
      toastOptions={{
        className: 'backdrop-blur-xl border-[rgba(139,92,246,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      }}
      {...props}
    />
  )
}

export { Toaster }
