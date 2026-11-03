import "reflect-metadata"
import { readFileSync } from "node:fs"
import { DataSource } from "typeorm"
import { entities } from "./entities"

const ds = new DataSource({ type: "mysql", database: "x", entities })
async function main() {
  await (ds as any).buildMetadatas() // validates relations/inverse sides, no DB connection

  const fromEntities = new Map<string, Set<string>>()
  for (const m of ds.entityMetadatas) {
    // join tables (role_permissions, promotion_items) are included as metadata too
    fromEntities.set(m.tableName, new Set(m.columns.map((c) => c.databaseName)))
  }

  const sql = readFileSync(process.argv[2], "utf8")
  const fromSql = new Map<string, Set<string>>()
  for (const block of sql.split(/CREATE TABLE IF NOT EXISTS /).slice(1)) {
    const table = block.match(/^`(\w+)`/)![1]
    const cols = new Set<string>()
    for (const line of block.split("\n")) {
      const c = line.match(/^  `(\w+)` /)
      if (c) cols.add(c[1])
    }
    fromSql.set(table, cols)
  }

  let problems = 0
  for (const [t, cols] of fromSql) {
    const e = fromEntities.get(t)
    if (!e) {
      console.log(`MISSING ENTITY  ${t}`)
      problems++
      continue
    }
    for (const c of cols)
      if (!e.has(c)) {
        console.log(`MISSING COLUMN  ${t}.${c}`)
        problems++
      }
    for (const c of e)
      if (!cols.has(c)) {
        console.log(`EXTRA COLUMN    ${t}.${c}`)
        problems++
      }
  }
  for (const t of fromEntities.keys())
    if (!fromSql.has(t)) {
      console.log(`EXTRA TABLE     ${t}`)
      problems++
    }
  console.log(
    `\nSQL tables: ${fromSql.size}, entity tables: ${fromEntities.size}, problems: ${problems}`
  )
  process.exit(problems ? 1 : 0)
}
main().catch((e) => {
  console.error(e)
  process.exit(2)
})
