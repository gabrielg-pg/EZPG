import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

function getConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED

  if (!connectionString) {
    throw new Error("No database connection string found in env vars")
  }

  return connectionString
}

// Inicialização lazy: a conexão só é criada (e a env var validada) na primeira
// utilização em runtime, e não durante o build/coleta de páginas do Next.js.
let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(getConnectionString())
  }
  return _sql
}

// Proxy que encaminha tanto chamadas de template tag (sql`...`) quanto
// acessos a métodos/propriedades, preservando a mesma API de `neon()`.
export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, argArray: unknown[]) {
    return (getSql() as unknown as (...args: unknown[]) => unknown)(...argArray)
  },
  get(_target, prop: string | symbol) {
    const value = getSql()[prop as keyof NeonQueryFunction<false, false>]
    return typeof value === "function" ? value.bind(getSql()) : value
  },
}) as NeonQueryFunction<false, false>
