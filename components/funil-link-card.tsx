"use client"

import { useState } from "react"
import { Link2, Copy, Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

type FunnelLinkCardProps = {
  /** Nome do funil, ex: "Funil Formulário" */
  title: string
  /** Caminho público, ex: "/qualificacao" */
  path: string
  /** Texto auxiliar explicando o vínculo */
  hint?: string
  className?: string
}

const BASE_DOMAIN = "progrowth-execucao.vercel.app"

export function FunnelLinkCard({ title, path, hint, className }: FunnelLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `https://${BASE_DOMAIN}${path}`
  const displayUrl = `${BASE_DOMAIN}${path}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Link2 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {title} <span className="text-muted-foreground">·</span>{" "}
            <span className="text-primary">link público</span>
          </p>
          <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{displayUrl}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar
            </>
          )}
        </button>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Abrir
        </a>
      </div>
    </div>
  )
}
