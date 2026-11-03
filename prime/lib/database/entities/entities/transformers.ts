import type { ValueTransformer } from "typeorm"

/** MySQL returns DECIMAL as a string ("390.00"). This converts it to a number. */
export const decimal: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) =>
    value === null || value === undefined ? null : Number(value),
}

/** tinyint(1) <-> boolean */
export const bool: ValueTransformer = {
  to: (value?: boolean | null) =>
    value === null || value === undefined ? value : value ? 1 : 0,
  from: (value?: number | boolean | null) =>
    value === null || value === undefined ? value : Boolean(value),
}
