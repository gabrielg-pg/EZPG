import { requireAdmin } from "@/lib/auth"
import { getInvestments } from "@/app/actions/investment-actions"
import { InvestmentsDashboard } from "@/components/investments-dashboard"

export const dynamic = "force-dynamic"

export default async function InvestimentosPage() {
  await requireAdmin()
  const data = await getInvestments()
  return <InvestmentsDashboard initialData={JSON.parse(JSON.stringify(data))} />
}
