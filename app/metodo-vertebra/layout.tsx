import type React from "react"
import { TrackingScripts } from "@/components/tracking-scripts"

export default function MetodoVertebraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Preconnect ao YouTube para o depoimento carregar rápido ao dar play */}
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="preconnect" href="https://i.ytimg.com" />
      <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />

      {/* Rastreamento GA4 + Meta Pixel (com as funções de evento dos funis) */}
      <TrackingScripts />

      {children}
    </>
  )
}
