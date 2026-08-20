import type React from "react"
import { TrackingScripts } from "@/components/tracking-scripts"

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TrackingScripts />
      {children}
    </>
  )
}
