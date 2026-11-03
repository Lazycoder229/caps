function normalizedPart(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ")
}

export function deduplicateAddressParts(values: (string | null | undefined)[]) {
  const parts = values.map(value => value?.trim() ?? "").filter(Boolean)
  return parts.filter((part, index) => {
    const key = normalizedPart(part)
    if (parts.slice(0, index).some(previous => normalizedPart(previous) === key)) return false
    return !parts.some((other, otherIndex) => {
      if (otherIndex === index) return false
      const otherKey = normalizedPart(other)
      return otherKey.length > key.length && (` ${otherKey} `).includes(` ${key} `)
    })
  })
}

export function normalizeAddressText(value: string) {
  return deduplicateAddressParts(value.split(/[,;\n]+/)).join(", ")
}
