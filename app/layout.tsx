import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { TrackingScripts } from "@/components/tracking-scripts"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-poppins" })

export const metadata: Metadata = {
  title: "PRO GROWTH GLOBAL - Sistema Interno",
  description: "Sistema interno PRO GROWTH GLOBAL",
  generator: "Gerp Business Solutions",
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
    <html lang="pt-BR" className={poppins.variable}>
      <body className={`font-sans antialiased`}>
        {/* GA4 + Meta Pixel em todas as páginas (PageView + funções de evento dos funis) */}
        <TrackingScripts />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
