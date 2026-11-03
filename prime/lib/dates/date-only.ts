/** Normalize MySQL DATE values, which mysql2 may return as JS Date objects. */
export function dateOnlyInManila(value: string | Date): string {
  if (value instanceof Date)
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value)
  return value.slice(0, 10)
}
