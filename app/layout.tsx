import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PRO GROWTH - Sistema de Onboarding",
  description: "Sistema interno de onboarding de lojas PRO GROWTH",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/apple-icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/apple-icon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/apple-icon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
