import { DataSource } from "typeorm"
import mysql from "mysql2"
import { entities } from "./entities/entities"

const port = Number(process.env.DB_PORT ?? 3306)
// Serverless deployments can create many short-lived app instances. The
// mysql2 default allows up to 10 connections per instance, which can exhaust
// a small managed database when Vercel scales out. Keep each instance's pool
// small while allowing deployments to tune it for their database plan.
const configuredPoolSize = Number(process.env.DB_POOL_SIZE ?? 2)
const poolSize =
  Number.isInteger(configuredPoolSize) && configuredPoolSize > 0
    ? configuredPoolSize
    : 2

/** Shared TypeORM connection for server-side code. Next.js loads `.env*` values. */
export const AppDataSource = new DataSource({
  type: "mysql",
  driver: mysql,
  host: process.env.DB_HOST ?? "",
  port: Number.isInteger(port) && port > 0 ? port : 3306,
  poolSize,
  username: process.env.DB_USERNAME ?? "",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_DATABASE ?? "",
  entities,
  synchronize: false,
  // `migrations` belongs to the application's AppMigration entity. Keep
  // TypeORM's own migration history in its separate tracker table.
  migrationsTableName: "typeorm_migrations",
  ...(process.env.DB_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
  migrations: ["lib/database/migrations/*{.ts,.js}"],
})

let initialization: Promise<DataSource> | undefined

export function getInitializedDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource)

  const requiredVariables = [
    "DB_HOST",
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_DATABASE",
  ]
  const missingVariables = requiredVariables.filter(
    (name) => process.env[name] === undefined
  )
  if (missingVariables.length > 0) {
    return Promise.reject(
      new Error(
        `Missing database configuration: ${missingVariables.join(", ")}`
      )
    )
  }

  initialization ??= AppDataSource.initialize().catch((error: unknown) => {
    initialization = undefined
    throw error
  })

  return initialization
}
