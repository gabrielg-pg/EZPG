"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"

export async function getStores() {
  const { user } = await getSession()
  if (!user) return []

  const stores = await sql`
    SELECT s.*, c.name as customer_name, u.name as created_by_name
    FROM stores s
    LEFT JOIN customers c ON c.store_id = s.id
    LEFT JOIN users u ON s.created_by = u.id
    ORDER BY CASE
      WHEN s.store_number ~ '^[0-9]+$' THEN CAST(s.store_number AS INTEGER)
      ELSE 0
    END DESC, s.store_number DESC
  `

  return stores
}

export async function createStore(data: {
  storeName: string
  storeNumber: string
  region: string
  plan: string
  customerName: string
  birthDate: string
  cpf: string
  passportNumber?: string
  passportPhotoUrl?: string
  address: string
  addressNumber: string
  cep: string
  driveLink?: string
  niche?: string
  numProducts?: number
  country?: string
  language?: string
  logoReferencesUrl?: string
  collections?: string
  storePolicies?: string
  accounts: Record<string, { login: string; password: string; enabled: boolean }>
}) {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autorizado" }
  }

  const customerName = data.customerName?.trim() ?? ""
  const cpf = data.cpf?.trim() ?? ""
  const cep = data.cep?.trim() ?? ""
  const address = data.address?.trim() ?? ""
  const addressNumber = data.addressNumber?.trim() ?? ""
  const birthDate = data.birthDate?.trim() ?? ""

  if (!data.storeName?.trim() || !data.storeNumber?.trim()) {
    return { success: false, error: "Nome e número da loja são obrigatórios" }
  }
  if (!customerName) return { success: false, error: "Nome do cliente é obrigatório" }
  if (birthDate && !isValidISODate(birthDate)) {
    return { success: false, error: "Data de nascimento inválida. Confira dia, mês e ano." }
  }
  if (cpf.length > 14) return { success: false, error: "CPF muito longo (máx. 14 caracteres)" }
  if (cep.length > 10) return { success: false, error: "CEP muito longo (máx. 10 caracteres)" }
  if (addressNumber.length > 20) return { success: false, error: "Número do endereço muito longo (máx. 20 caracteres)" }

  const enabledAccounts = Object.entries(data.accounts ?? {})
    .filter(([, acc]) => acc.enabled)
    .map(([accountType, acc]) => ({
      account_type: accountType,
      login: acc.login?.trim() ?? "",
      password: acc.password ?? "",
    }))

  try {
    // Single statement so the store, customer and accounts are saved together or not at all.
    const result = await sql`
      WITH new_store AS (
        INSERT INTO stores (name, store_number, region, plan, progress, status, created_by, drive_link, niche, num_products, country, language, logo_references_url, collections, store_policies, created_at)
        VALUES (${data.storeName.trim()}, ${data.storeNumber.trim()}, ${data.region}, ${data.plan}, 25, 'em_andamento', ${user.id}, ${data.driveLink || null}, ${data.niche || null}, ${data.numProducts || null}, ${data.country || null}, ${data.language || null}, ${data.logoReferencesUrl || null}, ${data.collections || null}, ${data.storePolicies || null}, CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
        RETURNING id
      ),
      new_customer AS (
        INSERT INTO customers (store_id, name, birth_date, cpf, passport_number, passport_photo_url, address, address_number, cep)
        SELECT id, ${customerName}, ${birthDate || null}::date, ${cpf}, ${data.passportNumber || null}, ${data.passportPhotoUrl || null}, ${address}, ${addressNumber}, ${cep}
        FROM new_store
        RETURNING id
      ),
      new_accounts AS (
        INSERT INTO store_accounts (store_id, account_type, login, password, enabled)
        SELECT ns.id, a.account_type, a.login, a.password, true
        FROM new_store ns, jsonb_to_recordset(${JSON.stringify(enabledAccounts)}::jsonb) AS a(account_type text, login text, password text)
        RETURNING id
      )
      SELECT
        (SELECT id FROM new_store) AS store_id,
        (SELECT COUNT(*)::int FROM new_customer) AS customers,
        (SELECT COUNT(*)::int FROM new_accounts) AS accounts
    `

    revalidatePath("/dashboard")
    return { success: true, storeId: result[0].store_id }
  } catch (error) {
    console.error("Create store error:", error)
    return { success: false, error: describeDbError(error) }
  }
}

function isValidISODate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y >= 1900
}

function describeDbError(error: unknown) {
  const code = (error as { code?: string })?.code
  if (code === "22007" || code === "22008") return "Data de nascimento inválida. Confira dia, mês e ano."
  if (code === "22001") return "Algum campo ultrapassou o tamanho permitido (CPF, CEP ou número)."
  if (code === "23514") return "Tipo de conta inválido para este plano."
  if (code === "23505") return "Já existe um registro com esses dados."
  return "Erro ao criar loja. Nenhum dado foi salvo, tente novamente."
}

export async function getStoreDetails(storeId: number) {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autorizado" }
  }

  try {
    const storeResult = await sql`
      SELECT s.*, u.name as created_by_name
      FROM stores s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ${storeId}
    `

    if (storeResult.length === 0) {
      return { success: false, error: "Loja não encontrada" }
    }

    const customerResult = await sql`
      SELECT * FROM customers WHERE store_id = ${storeId}
    `

    const accountsResult = await sql`
      SELECT * FROM store_accounts WHERE store_id = ${storeId}
    `

    return {
      success: true,
      data: {
        store: storeResult[0],
        customer: customerResult[0] || {},
        accounts: accountsResult,
      },
    }
  } catch (error) {
    console.error("Get store details error:", error)
    return { success: false, error: "Erro ao buscar detalhes" }
  }
}

export async function updateStore(
  storeId: number,
  data: Partial<{
    name: string
    store_number: string
    drive_link: string
    region: string
    plan: string
    niche: string
    num_products: number
    country: string
  language: string
  collections: string
  store_policies: string
  customer_name: string
    birth_date: string
    cpf: string
    address: string
    address_number: string
    cep: string
    accounts: Array<{ account_type: string; login: string; password: string; enabled: boolean }>
  }>,
) {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autorizado" }
  }

  try {
    await sql`
      UPDATE stores 
      SET 
        name = COALESCE(${data.name ?? null}, name),
        store_number = COALESCE(${data.store_number ?? null}, store_number),
        drive_link = COALESCE(${data.drive_link ?? null}, drive_link),
        region = COALESCE(${data.region ?? null}, region),
        plan = COALESCE(${data.plan ?? null}, plan),
        niche = COALESCE(${data.niche ?? null}, niche),
        num_products = COALESCE(${data.num_products ?? null}, num_products),
        country = COALESCE(${data.country ?? null}, country),
        language = COALESCE(${data.language ?? null}, language),
        collections = COALESCE(${data.collections ?? null}, collections),
        store_policies = COALESCE(${data.store_policies ?? null}, store_policies),
        updated_at = NOW()
      WHERE id = ${storeId}
    `

    // Update customer data if provided
    if (data.customer_name || data.birth_date || data.cpf || data.address || data.address_number || data.cep) {
      const updated = await sql`
        UPDATE customers 
        SET 
          name = COALESCE(${data.customer_name ?? null}, name),
          birth_date = COALESCE(${data.birth_date ?? null}, birth_date),
          cpf = COALESCE(${data.cpf ?? null}, cpf),
          address = COALESCE(${data.address ?? null}, address),
          address_number = COALESCE(${data.address_number ?? null}, address_number),
          cep = COALESCE(${data.cep ?? null}, cep)
        WHERE store_id = ${storeId}
        RETURNING id
      `
      // Stores saved without a customer row (failed earlier inserts) get one created here.
      if (updated.length === 0) {
        await sql`
          INSERT INTO customers (store_id, name, birth_date, cpf, address, address_number, cep)
          VALUES (${storeId}, ${data.customer_name?.trim() || "Sem nome"}, ${data.birth_date || null}, ${data.cpf || null}, ${data.address || null}, ${data.address_number || null}, ${data.cep || null})
        `
      }
    }

    // Update accounts if provided
    if (data.accounts && data.accounts.length > 0) {
      // Delete existing accounts
      await sql`DELETE FROM store_accounts WHERE store_id = ${storeId}`
      // Insert new accounts
      for (const account of data.accounts) {
        if (account.enabled) {
          await sql`
            INSERT INTO store_accounts (store_id, account_type, login, password, enabled)
            VALUES (${storeId}, ${account.account_type}, ${account.login}, ${account.password}, true)
          `
        }
      }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Update store error:", error)
    return { success: false, error: "Erro ao atualizar loja" }
  }
}

export async function updateStoreProgress(storeId: number, progress: number) {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autorizado" }
  }

  try {
    let status = "pendente"
    if (progress >= 100) {
      status = "concluido"
    } else if (progress > 0) {
      status = "em_andamento"
    }

    await sql`
      UPDATE stores 
      SET progress = ${progress}, status = ${status}, updated_at = NOW()
      WHERE id = ${storeId}
    `

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Update store error:", error)
    return { success: false, error: "Erro ao atualizar loja" }
  }
}

export async function deleteStore(storeId: number) {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autorizado" }
  }

  try {
    // Get the store's logo reference URL to delete from blob storage
    const storeResult = await sql`SELECT logo_references_url FROM stores WHERE id = ${storeId}`
    const logoUrl = storeResult[0]?.logo_references_url

    await sql`DELETE FROM stores WHERE id = ${storeId}`

    // Delete blob file if it exists
    if (logoUrl) {
      try {
        await del(logoUrl)
      } catch (blobError) {
        console.error("Error deleting blob:", blobError)
        // Don't fail the store deletion if blob deletion fails
      }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Delete store error:", error)
    return { success: false, error: "Erro ao excluir loja" }
  }
}
