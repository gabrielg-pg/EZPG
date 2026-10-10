import type React from "react"

export default function MetodoVertebraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Preconnect ao YouTube para o depoimento carregar rápido ao dar play */}
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="preconnect" href="https://i.ytimg.com" />
      <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />

      {children}
    </>
  )
}
