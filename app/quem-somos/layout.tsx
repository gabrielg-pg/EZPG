import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"

const OG_THUMB = "https://vumbnail.com/1214853650.jpg"

export const metadata: Metadata = {
  title: "Pro Growth — Quem somos em 5 minutos",
  description: "5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.",
  robots: { index: false, follow: false },
  icons: {
    icon: "https://progrowthglobal.com.br/wp-content/uploads/2026/01/cropped-Favicon-PG-270x270.png",
    apple: "https://progrowthglobal.com.br/wp-content/uploads/2026/01/cropped-Favicon-PG-270x270.png",
  },
  openGraph: {
    title: "Pro Growth — Quem somos em 5 minutos",
    description: "5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: OG_THUMB, width: 1280, height: 720, alt: "Pro Growth Global" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Growth — Quem somos em 5 minutos",
    description: "5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.",
    images: [OG_THUMB],
  },
}

export default function QuemSomosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Preconnect aos domínios do Vimeo para o vídeo carregar rápido, sem delay perceptível */}
      <link rel="preconnect" href="https://player.vimeo.com" crossOrigin="" />
      <link rel="preconnect" href="https://i.vimeocdn.com" crossOrigin="" />
      <link rel="preconnect" href="https://f.vimeocdn.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://player.vimeo.com" />
      {/* SDK do Vimeo — afterInteractive é o correto em layout aninhado do App Router.
          O vídeo em si dá autoplay pelo próprio iframe; o SDK só controla som e tempo. */}
      <Script src="https://player.vimeo.com/api/player.js" strategy="afterInteractive" />
      {children}
    </>
  )
}
