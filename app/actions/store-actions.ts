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
    ORDER BY CAST(s.store_number AS INTEGER) DESC
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
  address: string
  addressNumber: string
  cep: string
  driveLink?: string
  niche?: string
  numProducts?: number
  country?: string
  language?: string
  logoReferencesUrl?: string
  accounts: Record<string, { login: string; password: string; enabled: boolean }>
}) {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autorizado" }
  }

  try {
    const storeResult = await sql`
      INSERT INTO stores (name, store_number, region, plan, progress, status, created_by, drive_link, niche, num_products, country, language, logo_references_url)
      VALUES (${data.storeName}, ${data.storeNumber}, ${data.region}, ${data.plan}, 25, 'em_andamento', ${user.id}, ${data.driveLink || null}, ${data.niche || null}, ${data.numProducts || null}, ${data.country || null}, ${data.language || null}, ${data.logoReferencesUrl || null})
      RETURNING id
    `

    const storeId = storeResult[0].id

    await sql`
      INSERT INTO customers (store_id, name, birth_date, cpf, address, address_number, cep)
      VALUES (
        ${storeId}, 
        ${data.customerName}, 
        ${data.birthDate || null}, 
        ${data.cpf}, 
        ${data.address}, 
        ${data.addressNumber}, 
        ${data.cep}
      )
    `

    for (const [accountType, accountData] of Object.entries(data.accounts)) {
      if (accountData.enabled) {
        await sql`
          INSERT INTO store_accounts (store_id, account_type, login, password, enabled)
          VALUES (${storeId}, ${accountType}, ${accountData.login}, ${accountData.password}, true)
        `
      }
    }

    revalidatePath("/dashboard")
    return { success: true, storeId }
  } catch (error) {
    console.error("Create store error:", error)
    return { success: false, error: "Erro ao criar loja" }
  }
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
        updated_at = NOW()
      WHERE id = ${storeId}
    `

    // Update customer data if provided
    if (data.customer_name || data.birth_date || data.cpf || data.address || data.address_number || data.cep) {
      await sql`
        UPDATE customers 
        SET 
          name = COALESCE(${data.customer_name ?? null}, name),
          birth_date = COALESCE(${data.birth_date ?? null}, birth_date),
          cpf = COALESCE(${data.cpf ?? null}, cpf),
          address = COALESCE(${data.address ?? null}, address),
          address_number = COALESCE(${data.address_number ?? null}, address_number),
          cep = COALESCE(${data.cep ?? null}, cep)
        WHERE store_id = ${storeId}
      `
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
