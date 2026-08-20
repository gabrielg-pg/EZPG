import type React from "react"
import type { Metadata } from "next"
import { TrackingScripts } from "@/components/tracking-scripts"

export const metadata: Metadata = {
  title: "Qualificação — Pro Growth Global™",
  description: "Descubra se o seu perfil está pronto para uma operação de e-commerce estruturada.",
  robots: { index: false, follow: false },
  icons: {
    icon: "https://progrowthglobal.com.br/wp-content/uploads/2026/01/cropped-Favicon-PG-270x270.png",
  },
}

export default function QualificacaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrackingScripts />
      {children}
    </>
  )
}
