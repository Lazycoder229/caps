import type { DataSource } from "typeorm"

/** A future termination date should not disable an otherwise active employee. */
export async function hasTerminationDatePassed(
  source: DataSource,
  userId: string
) {
  const rows = (await source.query(
    `SELECT CASE
       WHEN date_terminated IS NOT NULL AND date_terminated < CURRENT_DATE() THEN 1
       ELSE 0
     END AS termination_passed
     FROM employees
     WHERE user_id = ?`,
    [userId]
  )) as Array<{ termination_passed: number | string | null }>

  return Number(rows[0]?.termination_passed ?? 0) === 1
}
