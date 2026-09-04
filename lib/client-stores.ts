export type ClientStoreType = "nacional" | "global"

export type AdspendCurrency = "BRL" | "USD" | "EUR" | "GBP"

export const ADSPEND_CURRENCIES: AdspendCurrency[] = ["BRL", "USD", "EUR", "GBP"]

export type ClientStoreEntry = {
  id: number
  name: string
  site: string
  niche: string
  type: ClientStoreType
  adspend: number
  adspend_currency: AdspendCurrency
  created_by: number | null
  created_by_name: string | null
  created_at: string
}
