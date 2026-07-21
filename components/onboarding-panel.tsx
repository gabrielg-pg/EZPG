"use client"

import { useState, useMemo, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Pencil, Save, X, ClipboardList, Lock } from "lucide-react"
import { updateOnboardingMessage, type OnboardingMessage } from "@/app/actions/onboarding-actions"

type TabKey = "brasil" | "global"

const TABS: { key: TabKey; label: string; plans: string }[] = [
  { key: "brasil", label: "Onboarding Brasil", plans: "Start Growth · Pro Vértebra · Scale Vértebra" },
  { key: "global", label: "Onboarding Global", plans: "Scale Global" },
]

export function OnboardingPanel({ initialMessages }: { initialMessages: OnboardingMessage[] }) {
  const [messages, setMessages] = useState<OnboardingMessage[]>(initialMessages)
  const [activeTab, setActiveTab] = useState<TabKey>("brasil")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState("")
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const visible = useMemo(
    () => messages.filter((m) => m.tab === activeTab).sort((a, b) => a.position - b.position),
    [messages, activeTab],
  )

  const startEdit = (m: OnboardingMessage) => {
    setEditingId(m.id)
    setDraft(m.body)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft("")
  }

  const saveEdit = (id: number) => {
    const newBody = draft
    startTransition(async () => {
      await updateOnboardingMessage(id, newBody)
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, body: newBody } : m)))
      setEditingId(null)
      setDraft("")
    })
  }

  // Copia o texto exatamente como está salvo (o espaçamento já vem correto do
  // conteúdo), preservando quebras e linhas em branco ao colar no WhatsApp.
  const copyBody = (m: OnboardingMessage) => {
    navigator.clipboard.writeText(m.body)
    setCopiedId(m.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const activeTabInfo = TABS.find((t) => t.key === activeTab)!

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Onboardings</h1>
        </div>
        <p className="text-muted-foreground text-sm pl-1">
          Scripts de onboarding do time, organizados por tipo de operação. Edite e copie cada mensagem para uso
          direto no atendimento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-sidebar-border pb-4">
        {TABS.map((tab) => {
          const active = tab.key === activeTab
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                cancelEdit()
              }}
              className={`flex flex-col items-start rounded-xl px-4 py-2.5 text-left transition-colors ${
                active
                  ? "bg-primary/15 border border-primary/40"
                  : "bg-sidebar border border-sidebar-border hover:border-primary/25"
              }`}
            >
              <span className={`text-sm font-semibold ${active ? "text-white" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
              <span className="text-[11px] text-muted-foreground/70">{tab.plans}</span>
            </button>
          )
        })}
      </div>

      {/* Active tab summary */}
      <p className="text-xs text-muted-foreground/70 -mt-4">
        Exibindo <span className="text-primary font-medium">{visible.length}</span> mensagens de{" "}
        <span className="text-white">{activeTabInfo.label}</span>
      </p>

      {/* Message cards */}
      <div className="flex flex-col gap-4">
        {visible.map((m) => {
          const isEditing = editingId === m.id
          const internal = m.is_internal
          return (
            <div
              key={m.id}
              className={`rounded-xl border p-5 transition-colors ${
                internal
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-sidebar-border bg-sidebar"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {internal && <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                  <h2
                    className={`text-sm font-bold tracking-wide ${
                      internal ? "text-amber-300" : "text-white"
                    }`}
                  >
                    {m.title}
                  </h2>
                </div>
                {!isEditing && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => copyBody(m)}
                      className="flex items-center gap-1.5 rounded-lg border border-sidebar-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:border-primary/40 transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-400" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(m)}
                      className="flex items-center gap-1.5 rounded-lg border border-sidebar-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:border-primary/40 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={Math.max(6, draft.split("\n").length + 1)}
                    className="w-full rounded-lg border border-primary/40 bg-background p-3 text-sm leading-relaxed text-white outline-none focus:border-primary resize-y font-sans"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(m.id)}
                      disabled={isPending}
                      className="bg-gradient-to-r from-primary to-primary/80 text-white hover:from-primary/90"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={isPending}
                      className="border-sidebar-border text-muted-foreground hover:text-white bg-transparent"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {m.body.split("\n").map((line, i) =>
                    line.trim() === "" ? (
                      <div key={i} className="h-2" aria-hidden="true" />
                    ) : (
                      <p
                        key={i}
                        className={`text-sm leading-relaxed ${
                          internal ? "text-amber-100/90" : "text-foreground/90"
                        }`}
                      >
                        {line}
                      </p>
                    ),
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
