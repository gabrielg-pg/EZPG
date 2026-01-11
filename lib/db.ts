import { neon } from "@neondatabase/serverless"

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error("No database connection string found in env vars")
}

export const sql = neon(connectionString)
