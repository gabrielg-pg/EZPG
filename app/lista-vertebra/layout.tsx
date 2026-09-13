import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Lista Vértebra™ — Pro Growth Global",
  description: "Garanta sua vaga no próximo ciclo de estruturação com o Método Vértebra™.",
  robots: { index: false, follow: false },
  icons: {
    icon: "https://progrowthglobal.com.br/wp-content/uploads/2026/01/cropped-Favicon-PG-270x270.png",
  },
}

export default function ListaVertebraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.className} min-h-[100dvh] bg-[#07070F] text-white antialiased`}>{children}</div>
  )
}
