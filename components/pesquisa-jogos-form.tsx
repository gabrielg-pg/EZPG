"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import Image from "next/image"
import { Loader2, CheckCircle2, Trophy, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIAS_JOGOS } from "@/lib/pesquisa-jogos"
import { cn } from "@/lib/utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function PesquisaJogosForm() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [outrosJogos, setOutrosJogos] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const totalSelecionados = selecionados.size

  const toggleJogo = useCallback((jogo: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(jogo)) next.delete(jogo)
      else next.add(jogo)
      return next
    })
  }, [])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (nome.trim().length < 3) next.nome = "Informe seu nome completo (mín. 3 caracteres)."
    if (!EMAIL_REGEX.test(email.trim())) next.email = "Informe um e-mail válido."
    if (telefone.trim() && telefone.replace(/\D/g, "").length < 8)
      next.telefone = "Telefone inválido."
    if (selecionados.size === 0 && outrosJogos.trim().length === 0)
      next.jogos = "Selecione ao menos um jogo ou informe outro em \"Outros\"."
    setErrors(next)
    return Object.keys(next).length === 0
  }, [nome, email, telefone, selecionados, outrosJogos])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return

      setIsSubmitting(true)
      try {
        const res = await fetch("/api/pesquisa-jogos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim() || null,
            jogos_selecionados: Array.from(selecionados),
            outros_jogos: outrosJogos.trim() || null,
          }),
        })
        const data = await res.json()

        if (!res.ok || !data.success) {
          if (data.field) setErrors({ [data.field]: data.error })
          else setErrors({ geral: data.error || "Erro ao enviar. Tente novamente." })
          return
        }
        setSucesso(true)
      } catch {
        setErrors({ geral: "Erro de conexão. Tente novamente." })
      } finally {
        setIsSubmitting(false)
      }
    },
    [nome, email, telefone, selecionados, outrosJogos, validate],
  )

  const podeEnviar = useMemo(
    () => totalSelecionados > 0 || outrosJogos.trim().length > 0,
    [totalSelecionados, outrosJogos],
  )

  if (sucesso) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="glass-card glow-primary flex max-w-md flex-col items-center gap-4 rounded-2xl p-10">
          <CheckCircle2 className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground text-balance">
            Obrigado! Sua resposta foi registrada.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Sua opinião vai ajudar a definir os jogos do campeonato municipal de São João Batista
            em 2026. Fique de olho nas nossas redes!
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-primary/30 ring-1 ring-primary/40">
          <Image
            src="/aeesjb-logo.png"
            alt="Logo AEESJB"
            width={56}
            height={56}
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
          Qual jogo você quer ver no campeonato 2026?
        </h1>
        <p className="text-lg font-medium text-primary">
          Escolha seus favoritos para o campeonato municipal 2026
        </p>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Sua opinião importa! Selecione os jogos que você gostaria de ver competindo em São João
          Batista em 2026.
        </p>
      </header>

      {/* Dados pessoais */}
      <div className="glass-card flex flex-col gap-4 rounded-2xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              aria-invalid={!!errors.nome}
            />
            {errors.nome && <span className="text-xs text-destructive">{errors.nome}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 md:max-w-[calc(50%-0.5rem)]">
          <Label htmlFor="telefone">Telefone / WhatsApp (opcional)</Label>
          <Input
            id="telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(48) 99999-9999"
            aria-invalid={!!errors.telefone}
          />
          {errors.telefone && <span className="text-xs text-destructive">{errors.telefone}</span>}
        </div>
      </div>

      {/* Jogos por categoria */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Escolha os jogos</h2>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              totalSelecionados > 0
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {totalSelecionados} selecionado{totalSelecionados === 1 ? "" : "s"}
          </span>
        </div>

        {errors.jogos && <span className="text-sm text-destructive">{errors.jogos}</span>}

        {CATEGORIAS_JOGOS.map((grupo) => (
          <div key={grupo.categoria} className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {grupo.categoria}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {grupo.jogos.map((jogo) => {
                const checked = selecionados.has(jogo)
                return (
                  <button
                    key={jogo}
                    type="button"
                    onClick={() => toggleJogo(jogo)}
                    aria-pressed={checked}
                    className={cn(
                      "transition-smooth flex items-center gap-3 rounded-xl border px-4 py-3 text-left",
                      checked
                        ? "border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/10"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {checked && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                    </span>
                    <span className="text-sm font-medium">{jogo}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Outros jogos — texto livre */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Outros, quais?
          </h3>
          <div className="flex flex-col gap-2">
            <Label htmlFor="outros-jogos" className="sr-only">
              Outros jogos não listados
            </Label>
            <Input
              id="outros-jogos"
              value={outrosJogos}
              onChange={(e) => setOutrosJogos(e.target.value)}
              placeholder="Digite outros jogos que você gostaria de ver (separe por vírgula)"
            />
            <p className="text-xs text-muted-foreground">
              Não encontrou seu jogo na lista? Escreva aqui os que estão faltando.
            </p>
          </div>
        </div>
      </div>

      {errors.geral && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.geral}
        </p>
      )}

      {/* Envio */}
      <div className="flex flex-col items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={!podeEnviar || isSubmitting}
          className="glow-primary w-full max-w-sm gap-2 text-base font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Trophy className="h-5 w-5" />
              Enviar Resposta
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Associação de Esportes Eletrônicos de São João Batista
        </p>
      </div>
    </form>
  )
}
