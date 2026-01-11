export interface StoreData {
  id: number
  name: string
  store_number: string
  region: "brasil" | "global"
  plan: string
  progress: number
  status: "em_andamento" | "concluido" | "pendente"
  created_at: string | Date
  customer_name?: string
  drive_link?: string
  created_by_name?: string
}
