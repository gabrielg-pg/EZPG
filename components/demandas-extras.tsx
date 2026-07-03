import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderOpen, ExternalLink } from "lucide-react"

const DRIVE_URL = "https://drive.google.com/drive/folders/1UaLtpLBsUkOQzKzglRFp6SXjSdBKc2-3?hl=pt-br"

const SEASONS = [
  {
    date: "20 de março",
    event: "Equinócio de março",
    brasil: { emoji: "🍂", label: "Início do Outono" },
    europa: { emoji: "🌸", label: "Início da Primavera" },
    eua: { emoji: "🌸", label: "Início da Primavera" },
  },
  {
    date: "21 de junho",
    event: "Solstício de junho",
    brasil: { emoji: "❄️", label: "Início do Inverno" },
    europa: { emoji: "☀️", label: "Início do Verão" },
    eua: { emoji: "☀️", label: "Início do Verão" },
  },
  {
    date: "23 de setembro",
    event: "Equinócio de setembro",
    brasil: { emoji: "🌸", label: "Início da Primavera" },
    europa: { emoji: "🍂", label: "Início do Outono" },
    eua: { emoji: "🍂", label: "Início do Outono" },
  },
  {
    date: "21 de dezembro",
    event: "Solstício de dezembro",
    brasil: { emoji: "☀️", label: "Início do Verão" },
    europa: { emoji: "❄️", label: "Início do Inverno" },
    eua: { emoji: "❄️", label: "Início do Inverno" },
  },
]

export function DemandasExtras() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Card do Drive */}
      <Card className="border-border bg-card p-5 lg:col-span-1">
        <div className="flex h-full flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Materiais e Referências</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse os arquivos e referências gerais no Google Drive.
              </p>
            </div>
          </div>
          <Button asChild className="w-full">
            <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer">
              Abrir Drive
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Card>

      {/* Card das Estações do Ano */}
      <Card className="border-border bg-card p-5 lg:col-span-2">
        <p className="text-lg font-semibold text-foreground">{"Estações do Ano — 2026"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Datas de início de cada estação por região (Hemisférios Sul e Norte).
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 font-semibold text-primary">Data 2026</th>
                <th className="px-3 py-2 font-semibold text-foreground">Brasil</th>
                <th className="px-3 py-2 font-semibold text-foreground">Europa</th>
                <th className="px-3 py-2 font-semibold text-foreground">Estados Unidos</th>
              </tr>
            </thead>
            <tbody>
              {SEASONS.map((s) => (
                <tr key={s.date} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-foreground">{s.date}</p>
                    <p className="text-xs text-muted-foreground">{s.event}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <span className="mr-1">{s.brasil.emoji}</span>
                    {s.brasil.label}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <span className="mr-1">{s.europa.emoji}</span>
                    {s.europa.label}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <span className="mr-1">{s.eua.emoji}</span>
                    {s.eua.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>
            Datas baseadas em referências astronômicas oficiais (equinócios e solstícios) para o ano de 2026. Pequenas
            variações de horas podem ocorrer conforme o fuso horário.
          </p>
          <p>
            Brasil e demais países do Hemisfério Sul têm as estações invertidas em relação à Europa e aos Estados Unidos
            (Hemisfério Norte).
          </p>
        </div>
      </Card>
    </div>
  )
}
