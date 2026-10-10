import type { Market, MarketInput } from "@/app/actions/market-guide-actions"

export type MarketDiscountDraft = MarketInput["discounts"][number] & { id: string }
export type MarketEditorValues = Omit<MarketInput, "discounts"> & { discounts: MarketDiscountDraft[] }

export const MARKET_FLAG_OPTIONS = [
  { flag: "🇮🇹", country: "Itália" },
  { flag: "🇧🇷", country: "Brasil" },
  { flag: "🇵🇹", country: "Portugal" },
  { flag: "🇪🇸", country: "Espanha" },
  { flag: "🇫🇷", country: "França" },
  { flag: "🇩🇪", country: "Alemanha" },
  { flag: "🇬🇧", country: "Reino Unido" },
  { flag: "🇺🇸", country: "Estados Unidos" },
  { flag: "🇨🇦", country: "Canadá" },
  { flag: "🇦🇺", country: "Austrália" },
  { flag: "🇲🇽", country: "México" },
  { flag: "🇳🇱", country: "Países Baixos" },
  { flag: "🇧🇪", country: "Bélgica" },
  { flag: "🇨🇭", country: "Suíça" },
  { flag: "🇦🇹", country: "Áustria" },
  { flag: "🇮🇪", country: "Irlanda" },
  { flag: "🇵🇱", country: "Polônia" },
  { flag: "🇸🇪", country: "Suécia" },
  { flag: "🇳🇴", country: "Noruega" },
  { flag: "🇩🇰", country: "Dinamarca" },
  { flag: "🇫🇮", country: "Finlândia" },
  { flag: "🇬🇷", country: "Grécia" },
  { flag: "🇹🇷", country: "Turquia" },
  { flag: "🇦🇪", country: "Emirados Árabes Unidos" },
  { flag: "🇮🇳", country: "Índia" },
  { flag: "🇯🇵", country: "Japão" },
  { flag: "🇰🇷", country: "Coreia do Sul" },
  { flag: "🇳🇿", country: "Nova Zelândia" },
  { flag: "🇨🇱", country: "Chile" },
  { flag: "🇦🇷", country: "Argentina" },
  { flag: "🇨🇴", country: "Colômbia" },
  { flag: "🇿🇦", country: "África do Sul" },
] as const

const FLAG_BY_MARKET_NAME: Record<string, string> = {
  italia: "🇮🇹",
  italy: "🇮🇹",
  brasil: "🇧🇷",
  brazil: "🇧🇷",
  portugal: "🇵🇹",
  espanha: "🇪🇸",
  spain: "🇪🇸",
  franca: "🇫🇷",
  france: "🇫🇷",
  alemanha: "🇩🇪",
  germany: "🇩🇪",
  "reino unido": "🇬🇧",
  "united kingdom": "🇬🇧",
  "estados unidos": "🇺🇸",
  "united states": "🇺🇸",
  canada: "🇨🇦",
  australia: "🇦🇺",
  mexico: "🇲🇽",
  japao: "🇯🇵",
  japan: "🇯🇵",
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function resolveMarketFlag(name: string, flag: string) {
  const candidate = flag.trim()
  if (candidate && !["🌐", "🌍", "🌎", "🌏"].includes(candidate)) return candidate
  return FLAG_BY_MARKET_NAME[normalizeKey(name)] ?? "🏳️"
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join(" · ")
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(stringifyValue).filter(Boolean).join(" · ")
  }
  return ""
}

export function sectionValueText(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) return value.map(sectionValueText).filter(Boolean).join(" · ")
  if (!value || typeof value !== "object") return ""

  const record = value as Record<string, unknown>
  if (typeof record.text === "string") return record.text.trim()
  if (typeof record.value === "string") return record.value.trim()
  if (Array.isArray(record.rows)) {
    return record.rows
      .map((row) => stringifyValue(row))
      .filter(Boolean)
      .join("\n")
  }

  return Object.entries(record)
    .map(([key, item]) => {
      const text = stringifyValue(item)
      return text ? `${key}: ${text}` : ""
    })
    .filter(Boolean)
    .join("\n")
}

function parseDiscountLine(line: string) {
  const [code = "", ...descriptionParts] = line.split(/\t+|\s+\|\s+|\s+[—–-]\s+/)
  return { code: code.trim(), description: descriptionParts.join(" · ").trim() }
}

function draftFromRow(row: unknown, index: number, marketId: number | "novo"): MarketDiscountDraft | null {
  if (typeof row === "string") {
    const parsed = parseDiscountLine(row)
    if (!parsed.code && !parsed.description) return null
    return { id: `${marketId}-discount-${index}`, ...parsed }
  }

  if (!row || typeof row !== "object" || Array.isArray(row)) return null

  const record = row as Record<string, unknown>
  const entries = Object.entries(record)
  const codeEntry = entries.find(([key]) => /^(code|codigo|código|cupom|discount_code)$/i.test(key.trim()))
    ?? entries.find(([key]) => /code|c[oó]digo|cupom/i.test(key))
    ?? entries[0]
  const descriptionEntry = entries.find(([key]) => /desc|descri[cç][aã]o/i.test(key))
  const extraValues = entries
    .filter(([key]) => key !== codeEntry?.[0] && key !== descriptionEntry?.[0])
    .map(([, value]) => stringifyValue(value))
    .filter(Boolean)
  const code = stringifyValue(codeEntry?.[1])
  const description = [stringifyValue(descriptionEntry?.[1]), ...extraValues].filter(Boolean).join(" · ")

  if (!code && !description) return null
  return { id: `${marketId}-discount-${index}`, code, description }
}

export function discountDraftsFromValue(value: unknown, marketId: number | "novo" = "novo"): MarketDiscountDraft[] {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(record?.rows)
      ? record.rows
      : typeof record?.text === "string"
        ? record.text.split(/\r?\n/).filter((line) => line.trim())
        : []

  return rows
    .map((row, index) => draftFromRow(row, index, marketId))
    .filter((row): row is MarketDiscountDraft => row !== null)
}

export function marketEditorValues(market: Market | null): MarketEditorValues {
  const values = market?.section_values ?? {}
  const name = market?.name ?? ""

  return {
    name,
    flag: resolveMarketFlag(name, market?.flag ?? ""),
    currency: market?.currency ?? "",
    language: market?.language ?? "",
    domain: sectionValueText(values.domain),
    email: sectionValueText(values.email),
    shipping: sectionValueText(values.shipping),
    payments: sectionValueText(values.payments),
    discounts: discountDraftsFromValue(values.discounts, market?.id ?? "novo"),
  }
}

export function marketEditorSnapshot(values: MarketEditorValues) {
  return JSON.stringify({
    name: values.name,
    flag: values.flag,
    currency: values.currency,
    language: values.language,
    domain: values.domain,
    email: values.email,
    shipping: values.shipping,
    payments: values.payments,
    discounts: values.discounts.map(({ code, description }) => ({ code, description })),
  })
}

export function marketSectionValuesFromInput(input: MarketInput): Record<string, unknown> {
  return {
    shipping: { text: input.shipping },
    discounts: { rows: input.discounts.map(({ code, description }) => ({ code, description })) },
    domain: { text: input.domain },
    email: { text: input.email },
    payments: { text: input.payments },
  }
}

export function formatMarketDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("pt-BR")
}

export function sectionContentText(section: { content: Record<string, unknown>; section_type: string }) {
  return sectionValueText(section.content)
}

export function marketDiscountCount(market: Market) {
  if (typeof market.discount_count === "number") return market.discount_count
  return discountDraftsFromValue(market.section_values?.discounts, market.id).filter((discount) => discount.code.trim()).length
}

export function isKnownMarketFlag(flag: string) {
  return MARKET_FLAG_OPTIONS.some((option) => option.flag === flag)
}

export function newDiscountId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `discount-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function editorValuesToInput(values: MarketEditorValues): MarketInput {
  return {
    name: values.name,
    flag: values.flag,
    currency: values.currency,
    language: values.language,
    domain: values.domain,
    email: values.email,
    shipping: values.shipping,
    payments: values.payments,
    discounts: values.discounts.map(({ code, description }) => ({ code, description })),
  }
}

export function mergeMarketInput(market: Market, input: MarketInput, updatedAt?: string): Market {
  return {
    ...market,
    ...input,
    flag: resolveMarketFlag(input.name, input.flag),
    section_values: {
      ...market.section_values,
      ...marketSectionValuesFromInput(input),
    },
    discount_count: input.discounts.filter(({ code }) => code.trim()).length,
    updated_at: updatedAt ?? new Date().toISOString(),
  }
}

export function toMarketSectionContent(input: MarketInput, sectionKey: string) {
  return marketSectionValuesFromInput(input)[sectionKey]
}

export function formatSectionValue(section: { content: Record<string, unknown> }) {
  return sectionValueText(section.content)
}

export function countryLabelForFlag(flag: string) {
  return MARKET_FLAG_OPTIONS.find((option) => option.flag === flag)?.country ?? "Emoji personalizado"
}

export function marketSectionValue(market: Market, key: string) {
  return sectionValueText(market.section_values?.[key])
}

export function visibleMarketFlag(market: Market) {
  return resolveMarketFlag(market.name, market.flag)
}

export function discountTextParts(row: MarketDiscountDraft) {
  return { code: row.code.trim(), description: row.description.trim() }
}

export function filterDiscountDrafts(rows: MarketDiscountDraft[]) {
  return rows
    .map(discountTextParts)
    .filter(({ code, description }) => code.length > 0 || description.length > 0)
}

export function discountDraftsWithIds(rows: Array<{ code: string; description: string }>, marketId: number | "novo") {
  return rows.map((row, index) => ({ id: `${marketId}-discount-${index}`, ...row }))
}

export function marketHeaderSubtitle(market: Market) {
  return [market.language, market.currency].filter(Boolean).join(" · ") || "Dados do mercado"
}

export function copyLabel(copied: boolean) {
  return copied ? "Copiado!" : "Copiar"
}

export function cleanDiscountRows(rows: MarketDiscountDraft[]) {
  return rows
    .map(({ code, description }) => ({ code: code.trim(), description: description.trim() }))
    .filter((row) => row.code.length > 0 || row.description.length > 0)
}

export function sectionKey(section: { section_key: string | null; title: string }) {
  return section.section_key || section.title
}

export function isCoreMarketSection(section: { section_key: string | null }) {
  return ["discounts", "domain", "email", "payments"].includes(section.section_key ?? "")
}

export function countryFlagForName(name: string) {
  return FLAG_BY_MARKET_NAME[normalizeKey(name)] ?? ""
}

export function simpleDiscountRow(code: string, description: string): MarketDiscountDraft {
  return { id: newDiscountId(), code, description }
}

export function getMarketSection(market: Market, key: string) {
  return market.section_values?.[key]
}

export function getSectionInfoText(section: unknown) {
  return sectionValueText(section)
}

export function isGenericMarketFlag(flag: string) {
  return !flag.trim() || ["🌐", "🌍", "🌎", "🌏"].includes(flag.trim())
}

export function copyDiscountValue(row: MarketDiscountDraft) {
  return row.code.trim()
}

export function marketDisplayFlag(name: string, flag: string) {
  return resolveMarketFlag(name, flag)
}

export function discountCodesFromMarket(market: Market) {
  return discountDraftsFromValue(market.section_values?.discounts, market.id)
}

export function marketValueFromSections(sections: Record<string, unknown> | undefined, key: string) {
  return sectionValueText(sections?.[key])
}

export function normalizeEditorDiscounts(values: MarketEditorValues) {
  return filterDiscountDrafts(values.discounts)
}

export function getCopyText(value: unknown) {
  return sectionValueText(value)
}

export function buildSectionContent(input: MarketInput) {
  return marketSectionValuesFromInput(input)
}

export function isDiscountRowComplete(row: MarketDiscountDraft) {
  return row.code.trim().length > 0
}

export function emptyMarketEditorValues(): MarketEditorValues {
  return {
    name: "",
    flag: "",
    currency: "",
    language: "",
    domain: "",
    email: "",
    shipping: "",
    payments: "",
    discounts: [],
  }
}

export function marketNameSearchText(market: Market) {
  return [market.name, market.language, market.currency].filter(Boolean).join(" ")
}

export function formatDiscountText(rows: MarketDiscountDraft[]) {
  return rows.map(({ code, description }) => [code.trim(), description.trim()].filter(Boolean).join(" — ")).filter(Boolean).join("\n")
}

export function defaultMarketFlag(name: string) {
  return countryFlagForName(name) || "🏳️"
}

export function copySuccessMessage(label: string) {
  return `${label} copiado para a área de transferência.`
}

export function serializeDiscountContent(rows: MarketDiscountDraft[]) {
  return { rows: cleanDiscountRows(rows) }
}

export function sectionTextForList(value: unknown) {
  return sectionValueText(value).replace(/\s+/g, " ").trim()
}

export function isMarketInputDirty(values: MarketEditorValues, initial: string) {
  return marketEditorSnapshot(values) !== initial
}

export function normalizeMarketSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR")
}

export function safeMarketName(value: string) {
  return value.trim().slice(0, 120)
}

export function nonEmptyDiscounts(rows: MarketDiscountDraft[]) {
  return cleanDiscountRows(rows).filter(({ code }) => code.length > 0)
}

export function displayMarketCurrency(market: Market) {
  return market.currency || "A definir"
}

export function displayMarketLanguage(market: Market) {
  return market.language || "Idioma a definir"
}

export function sectionValueOrPlaceholder(value: unknown) {
  return sectionValueText(value) || "A definir"
}

export function discountCountLabel(count: number) {
  return `${count} ${count === 1 ? "código" : "códigos"}`
}

export function getMarketDescription(market: Market) {
  return marketHeaderSubtitle(market)
}

export function parseDiscountText(value: string) {
  return value.split(/\r?\n/).map(parseDiscountLine).filter((row) => row.code || row.description)
}

export function sectionsToMarketValues(sections: Array<{ section_key: string | null; title: string; content: Record<string, unknown> }>) {
  return Object.fromEntries(sections.map((section) => [section.section_key || section.title, section.content]))
}

export function infoValue(value: unknown) {
  return sectionValueText(value) || "Não preenchido"
}

export function marketEditorValueForSection(values: MarketEditorValues, key: string) {
  if (key === "shipping" || key === "domain" || key === "email" || key === "payments") return values[key]
  return ""
}

export function sectionDisplayName(section: { title: string; section_key: string | null }) {
  return section.title || section.section_key || "Seção"
}

export function sortedDiscounts(rows: MarketDiscountDraft[]) {
  return rows.map((row) => ({ ...row }))
}

export function marketCardSearchText(market: Market) {
  return [
    marketNameSearchText(market),
    ...Object.values(market.section_values ?? {}).map(sectionValueText),
  ].join(" ").toLocaleLowerCase("pt-BR")
}

export function replaceMarketSectionValues(market: Market, input: MarketInput, updatedAt?: string) {
  return mergeMarketInput(market, input, updatedAt)
}

export function sectionTextByKey(market: Market, key: string) {
  return sectionValueText(market.section_values?.[key])
}

export function marketLabel(market: Market) {
  return market.name || "Mercado sem nome"
}

export function sortMarketDiscounts(rows: MarketDiscountDraft[]) {
  return rows
}

export function discountCountFromValue(value: unknown) {
  return discountDraftsFromValue(value).filter(({ code }) => code.trim()).length
}

export function displayDate(value: string) {
  return formatMarketDate(value)
}

export function serializeMarketEditor(values: MarketEditorValues) {
  return marketEditorSnapshot(values)
}

export function marketFieldText(market: Market, key: string) {
  return marketSectionValue(market, key)
}

export function discountCodeKey(row: MarketDiscountDraft) {
  return row.id
}

export function formatMarketFlagLabel(market: Market) {
  return `${visibleMarketFlag(market)} ${market.name}`
}

export function blankDiscountRow(): MarketDiscountDraft {
  return simpleDiscountRow("", "")
}

export function marketHasDiscounts(market: Market) {
  return marketDiscountCount(market) > 0
}

export function normalizeMarketInputForDisplay(input: MarketInput) {
  return { ...input, flag: resolveMarketFlag(input.name, input.flag) }
}

export function splitDiscountDescription(value: string) {
  return parseDiscountLine(value)
}

export function marketFieldValue(values: MarketEditorValues, key: keyof Omit<MarketInput, "discounts">) {
  return values[key]
}

export function sectionCopyText(value: unknown) {
  return sectionValueText(value)
}

export function normalizeDiscountDrafts(rows: MarketDiscountDraft[]) {
  return cleanDiscountRows(rows)
}

export function marketStatusLabel(market: Market) {
  return market.status === "archived" ? "Arquivado" : "Ativo"
}

export function searchMarketValue(value: string) {
  return normalizeMarketSearchValue(value)
}

export function marketValueLabel(key: string) {
  const labels: Record<string, string> = {
    currency: "Moeda",
    language: "Língua nativa",
    shipping: "Método de envio",
    domain: "Domínio",
    email: "E-mail",
    payments: "Pagamentos",
  }
  return labels[key] ?? key
}

export function findMarketFlag(value: string) {
  return MARKET_FLAG_OPTIONS.find((option) => option.flag === value)
}

export function formatDiscountRows(rows: MarketDiscountDraft[]) {
  return rows.map(({ code, description }) => ({ code: code.trim(), description: description.trim() }))
}

export function marketUpdatedBy(market: Market) {
  return market.updated_by_name || "Admin"
}

export function marketSectionCount(market: Market) {
  return market.section_count ?? 0
}

export function discountRowDescription(row: MarketDiscountDraft) {
  return row.description.trim()
}

export function marketIconLabel(market: Market) {
  return `${market.name}, ${market.language || "idioma não definido"}`
}

export function sectionInfoValue(sections: Record<string, unknown> | undefined, key: string) {
  return sectionValueText(sections?.[key])
}

export function discountRowCount(value: unknown) {
  return discountDraftsFromValue(value).filter((row) => row.code.trim()).length
}

export function formatMarketSummary(market: Market) {
  return [market.language, market.currency].filter(Boolean).join(" · ")
}

export function marketIcon(market: Market) {
  return visibleMarketFlag(market)
}

export function getSectionValueRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function discountRowsForInput(rows: MarketDiscountDraft[]) {
  return rows.map(({ code, description }) => ({ code: code.trim(), description: description.trim() }))
}

export function isDiscountValue(value: unknown) {
  return Array.isArray(value) || Boolean(value && typeof value === "object")
}

export function marketInfoValue(market: Market, key: string) {
  if (key === "currency") return market.currency
  if (key === "language") return market.language
  return marketSectionValue(market, key)
}

export function sectionRecordValue(content: Record<string, unknown>, key: string) {
  return sectionValueText(content[key])
}

export function sectionEntriesText(value: unknown) {
  return sectionValueText(value)
}

export function marketFieldSummary(market: Market, key: string) {
  return marketInfoValue(market, key)
}

export function marketFormValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

export function marketFlagValue(name: string, flag: string) {
  return resolveMarketFlag(name, flag)
}

export function readMarketDiscounts(market: Market) {
  return discountCodesFromMarket(market)
}

export function sectionRows(value: unknown) {
  const record = getSectionValueRecord(value)
  return Array.isArray(record.rows) ? record.rows : []
}

export function normalizedDiscountLabel(rows: MarketDiscountDraft[]) {
  return discountCountLabel(rows.filter(({ code }) => code.trim()).length)
}

export function emptyText(value: unknown) {
  return sectionValueText(value) || "—"
}

export function marketFormValuesFromInput(input: MarketInput, market?: Market | null): MarketEditorValues {
  const values = marketEditorValues(market ?? null)
  return {
    ...values,
    ...input,
    flag: resolveMarketFlag(input.name, input.flag),
    discounts: discountDraftsWithIds(input.discounts, market?.id ?? "novo"),
  }
}

export function cleanMarketInput(input: MarketEditorValues): MarketInput {
  return editorValuesToInput(input)
}

export function marketFieldOrder() {
  return ["currency", "shipping", "domain", "email", "payments"] as const
}

export function marketCardValue(market: Market, key: string) {
  return key === "language" ? market.language : key === "currency" ? market.currency : marketSectionValue(market, key)
}

export function shouldInferMarketFlag(flag: string) {
  return isGenericMarketFlag(flag) || !flag.trim()
}

export function marketDiscountRows(market: Market) {
  return discountDraftsFromValue(getMarketSection(market, "discounts"), market.id)
}

export function statusDateLabel(value: string) {
  return `Atualizado em ${formatMarketDate(value)}`
}

export function inputForMarket(market: Market | null) {
  return marketEditorValues(market)
}

export function marketDetailText(value: unknown) {
  return sectionValueText(value)
}

export function textForSection(section: { content: Record<string, unknown> }) {
  return sectionValueText(section.content)
}

export function discountRowLabel(row: MarketDiscountDraft) {
  return row.description ? `${row.code} — ${row.description}` : row.code
}

export function countActiveDiscounts(rows: MarketDiscountDraft[]) {
  return rows.filter(({ code }) => code.trim()).length
}

export function marketSearchValue(market: Market) {
  return marketCardSearchText(market)
}

export function buildMarketSectionValues(input: MarketInput) {
  return marketSectionValuesFromInput(input)
}

export function compareEditorValues(values: MarketEditorValues, initial: string) {
  return marketEditorSnapshot(values) !== initial
}

export function getMarketFlag(name: string, flag: string) {
  return resolveMarketFlag(name, flag)
}

export function displaySectionText(value: unknown) {
  return sectionValueText(value)
}

export function marketDiscountsLabel(market: Market) {
  return discountCountLabel(marketDiscountCount(market))
}

export function textFromSectionValues(market: Market, key: string) {
  return sectionValueText(market.section_values?.[key])
}

export function normalizeMarketFlag(name: string, flag: string) {
  return resolveMarketFlag(name, flag)
}

export function getMarketDiscounts(market: Market) {
  return discountDraftsFromValue(market.section_values?.discounts, market.id)
}

export function buildMarketValues(market: Market | null) {
  return marketEditorValues(market)
}

export function sectionTextContent(content: Record<string, unknown>) {
  return sectionValueText(content)
}

export function marketSummaryValue(market: Market, key: string) {
  return marketCardValue(market, key)
}

export function readDiscountCount(market: Market) {
  return marketDiscountCount(market)
}

export function getMarketField(market: Market, key: string) {
  return marketInfoValue(market, key)
}

export function buildBlankMarketValues() {
  return emptyMarketEditorValues()
}

export function marketCardFlag(market: Market) {
  return resolveMarketFlag(market.name, market.flag)
}

export function marketValueForSearch(market: Market) {
  return marketCardSearchText(market)
}

export function sectionLabel(section: { title: string }) {
  return section.title
}

export function formatDatePtBr(value: string) {
  return formatMarketDate(value)
}

export function codeList(value: unknown, marketId: number | "novo" = "novo") {
  return discountDraftsFromValue(value, marketId)
}

export function marketInputSectionValues(input: MarketInput) {
  return marketSectionValuesFromInput(input)
}

export function marketFormSnapshot(values: MarketEditorValues) {
  return marketEditorSnapshot(values)
}

export function hasMarketDiscounts(market: Market) {
  return marketDiscountCount(market) > 0
}

export function marketHeaderName(market: Market) {
  return market.name
}

export function codeCount(value: unknown) {
  return discountRowCount(value)
}

export function sectionContentValue(section: { content: Record<string, unknown> }) {
  return sectionValueText(section.content)
}

export function marketLanguage(market: Market) {
  return market.language || "Idioma não definido"
}

export function marketCurrency(market: Market) {
  return market.currency || "Moeda não definida"
}

export function marketFieldValues(market: Market) {
  return {
    currency: market.currency,
    language: market.language,
    shipping: marketSectionValue(market, "shipping"),
    domain: marketSectionValue(market, "domain"),
    email: marketSectionValue(market, "email"),
    payments: marketSectionValue(market, "payments"),
  }
}

export function normalizedMarketCountry(name: string) {
  return normalizeKey(name)
}

export function marketEditorHasChanges(values: MarketEditorValues, initial: string) {
  return marketEditorSnapshot(values) !== initial
}

export function newMarketValues() {
  return emptyMarketEditorValues()
}

export function newDiscountDraft(code = "", description = "") {
  return { id: newDiscountId(), code, description }
}

export function marketInputSectionContent(input: MarketInput, key: string) {
  return marketSectionValuesFromInput(input)[key]
}

export function normalizedFlagForMarket(name: string, flag: string) {
  return resolveMarketFlag(name, flag)
}

export function sectionTextFromContent(content: Record<string, unknown>) {
  return sectionValueText(content)
}

export function marketFlagIsKnown(flag: string) {
  return isKnownMarketFlag(flag)
}

export function getDiscountDrafts(value: unknown, marketId: number | "novo" = "novo") {
  return discountDraftsFromValue(value, marketId)
}

export function marketDisplayName(market: Market) {
  return market.name
}

export function marketInformationText(market: Market, key: string) {
  return marketInfoValue(market, key)
}

export function formatCodeCount(count: number) {
  return discountCountLabel(count)
}

export function normalizeSectionValue(value: unknown) {
  return sectionValueText(value)
}

export function countDiscounts(value: unknown) {
  return discountRowCount(value)
}

export function marketDomain(market: Market) {
  return marketSectionValue(market, "domain")
}

export function marketEmail(market: Market) {
  return marketSectionValue(market, "email")
}

export function marketShipping(market: Market) {
  return marketSectionValue(market, "shipping")
}

export function marketPayments(market: Market) {
  return marketSectionValue(market, "payments")
}

export function sectionContentAsText(value: unknown) {
  return sectionValueText(value)
}

export function getMarketCodes(market: Market) {
  return marketDiscountRows(market)
}

export function codeToCopy(row: MarketDiscountDraft) {
  return row.code.trim()
}

export function marketStatusText(market: Market) {
  return market.status === "active" ? "Ativo" : "Arquivado"
}

export function makeMarketTitle(market: Market) {
  return `${visibleMarketFlag(market)} ${market.name}`
}

export function dateText(value: string) {
  return formatMarketDate(value)
}

export function getMarketFieldText(market: Market, key: string) {
  return marketInfoValue(market, key)
}

export function copyText(value: unknown) {
  return sectionValueText(value)
}

export function getMarketRows(value: unknown) {
  return sectionRows(value)
}

export function normalizeTextSearch(value: string) {
  return normalizeMarketSearchValue(value)
}

export function makeEmptyEditorValues() {
  return emptyMarketEditorValues()
}

export function mapMarketSections(input: MarketInput) {
  return marketSectionValuesFromInput(input)
}

export function cleanEditorInput(values: MarketEditorValues) {
  return editorValuesToInput(values)
}

export function flagForMarket(name: string, flag: string) {
  return resolveMarketFlag(name, flag)
}

export function labelForMarketField(key: string) {
  return marketValueLabel(key)
}

export function getMarketDiscountsCount(market: Market) {
  return marketDiscountCount(market)
}

export function toReadableSection(section: { content: Record<string, unknown> }) {
  return sectionValueText(section.content)
}

export function marketValueString(market: Market, key: string) {
  return marketInfoValue(market, key)
}

export function searchableMarketText(market: Market) {
  return marketCardSearchText(market)
}

export function discountText(row: MarketDiscountDraft) {
  return row.code.trim()
}

export function getFlagOption(flag: string) {
  return findMarketFlag(flag)
}

export function marketSubtitle(market: Market) {
  return marketHeaderSubtitle(market)
}

export function countCodes(market: Market) {
  return marketDiscountCount(market)
}

export function textValue(value: unknown) {
  return sectionValueText(value)
}

export function valueFromMarket(market: Market, key: string) {
  return marketInfoValue(market, key)
}

export function getMarketDate(value: string) {
  return formatMarketDate(value)
}

export function marketCardValues(market: Market) {
  return marketFieldValues(market)
}

export function createEditorValues(market: Market | null) {
  return marketEditorValues(market)
}

export function updateMarketSections(input: MarketInput) {
  return marketSectionValuesFromInput(input)
}

export function valueText(value: unknown) {
  return sectionValueText(value)
}

export function toMarketInput(values: MarketEditorValues) {
  return editorValuesToInput(values)
}

export function marketCodes(market: Market) {
  return discountDraftsFromValue(market.section_values?.discounts, market.id)
}

export function dateLabel(value: string) {
  return `Atualizado em ${formatMarketDate(value)}`
}

export function marketFlagText(market: Market) {
  return resolveMarketFlag(market.name, market.flag)
}

export function countryOptionLabel(flag: string) {
  return findMarketFlag(flag)?.country ?? "Emoji personalizado"
}

export function normalizeDiscountList(rows: MarketDiscountDraft[]) {
  return cleanDiscountRows(rows)
}

export function marketCodeCount(market: Market) {
  return marketDiscountCount(market)
}

export function searchableText(value: unknown) {
  return sectionValueText(value).toLocaleLowerCase("pt-BR")
}

export function sectionValuesForMarket(market: Market) {
  return market.section_values ?? {}
}

export function marketInfoRows(market: Market) {
  return marketFieldValues(market)
}

export function currentMarketFlag(market: Market) {
  return resolveMarketFlag(market.name, market.flag)
}

export function codeCountText(count: number) {
  return discountCountLabel(count)
}

export function formatMarketName(market: Market) {
  return market.name
}

export function contentText(value: unknown) {
  return sectionValueText(value)
}

export function sectionValueForMarket(market: Market, key: string) {
  return sectionValueText(market.section_values?.[key])
}

export function marketCodeRows(market: Market) {
  return discountDraftsFromValue(market.section_values?.discounts, market.id)
}

export function isMarketFlagPreset(flag: string) {
  return isKnownMarketFlag(flag)
}

export function marketUpdateLabel(market: Market) {
  return `Atualizado em ${formatMarketDate(market.updated_at)}`
}

export function marketValuesForEditor(market: Market | null) {
  return marketEditorValues(market)
}

export function formatMarketSearchValue(value: string) {
  return normalizeMarketSearchValue(value)
}

export function mapDiscountRows(value: unknown, marketId: number | "novo" = "novo") {
  return discountDraftsFromValue(value, marketId)
}

export function codeLabel(row: MarketDiscountDraft) {
  return row.description.trim() ? `${row.code.trim()} — ${row.description.trim()}` : row.code.trim()
}

export function marketValueSummary(market: Market, key: string) {
  return marketCardValue(market, key)
}

export function marketFlagForCard(market: Market) {
  return resolveMarketFlag(market.name, market.flag)
}

export function discountCodesLabel(market: Market) {
  return discountCountLabel(marketDiscountCount(market))
}

export function valueLabel(value: unknown) {
  return sectionValueText(value) || "A definir"
}

export function sectionDataText(value: unknown) {
  return sectionValueText(value)
}

export function discountRowCode(row: MarketDiscountDraft) {
  return row.code.trim()
}

export function marketCodeRowsFromValue(value: unknown, marketId: number | "novo" = "novo") {
  return discountDraftsFromValue(value, marketId)
}

export function marketEditableValues(market: Market | null) {
  return marketEditorValues(market)
}

export function marketContactEmail(market: Market) {
  return marketSectionValue(market, "email")
}

export function marketHost(market: Market) {
  return marketSectionValue(market, "domain")
}

export function marketMethod(market: Market) {
  return marketSectionValue(market, "shipping")
}

export function marketPaymentInfo(market: Market) {
  return marketSectionValue(market, "payments")
}

export function displayCodeCount(market: Market) {
  return discountCountLabel(marketDiscountCount(market))
}

export function formatMarketNameSearch(market: Market) {
  return marketCardSearchText(market)
}

export function flagOptionValue(flag: string) {
  return isKnownMarketFlag(flag) ? flag : "custom"
}

export function marketValueFromInput(input: MarketInput, key: string) {
  return marketSectionValuesFromInput(input)[key]
}

export function isLegacyGlobe(flag: string) {
  return ["🌐", "🌍", "🌎", "🌏"].includes(flag.trim())
}

export function getSectionText(value: unknown) {
  return sectionValueText(value)
}

export function codeDescription(row: MarketDiscountDraft) {
  return row.description.trim()
}

export function marketCardInfo(market: Market) {
  return {
    language: market.language,
    currency: market.currency,
    shipping: marketSectionValue(market, "shipping"),
    domain: marketSectionValue(market, "domain"),
    email: marketSectionValue(market, "email"),
    payments: marketSectionValue(market, "payments"),
  }
}
