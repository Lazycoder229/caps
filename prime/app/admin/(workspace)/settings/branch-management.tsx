"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"
import { Building2, Check, Pencil, Plus, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminFeedback } from "@/components/admin-feedback"
import {
  BRANCH_TYPES,
  BRANCH_TYPE_LABELS,
} from "@/lib/database/entities/branch-types"
import { setBranchActive, saveBranch } from "./branch-actions"
import type { BranchSummary } from "./types"

type BranchDraft = Omit<BranchSummary, "id"> & { id: string }
const emptyDraft: BranchDraft = {
  id: "",
  name: "",
  code: "",
  type: "branch",
  address: null,
  contactNumber: null,
  email: null,
  isMain: false,
  isActive: true,
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"

export function BranchManagement({ branches }: { branches: BranchSummary[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { toast, confirm } = useAdminFeedback()
  const [draft, setDraft] = useState<BranchDraft | null>(null)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await saveBranch(formData)
      toast(result.ok ? "success" : "error", result.message)
      if (result.ok) {
        setDraft(null)
        router.refresh()
      }
    })
  }

  async function toggleActive(branch: BranchSummary) {
    if (
      branch.isActive &&
      !(await confirm({
        title: "Deactivate branch?",
        description: `${branch.name} will no longer be available for operations. Its records will be kept.`,
        confirmLabel: "Deactivate",
        destructive: true,
      }))
    )
      return
    startTransition(async () => {
      const result = await setBranchActive(branch.id, !branch.isActive)
      toast(result.ok ? "success" : "error", result.message)
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Branch management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add or update branches. Deactivate a branch to keep its history.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => setDraft({ ...emptyDraft })}
        >
          <Plus className="size-4" aria-hidden="true" /> Add branch
        </Button>
      </div>

      {branches.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {branches.map((branch) => (
            <article key={branch.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-md bg-amber-500/10 p-2 text-amber-600">
                    <Building2 className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{branch.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {branch.code} · {branch.type}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {branch.isMain ? (
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Main
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${branch.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                  >
                    {branch.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {branch.address ? <p>{branch.address}</p> : null}
                {branch.contactNumber ? <p>{branch.contactNumber}</p> : null}
                {branch.email ? (
                  <p className="break-all">{branch.email}</p>
                ) : null}
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setDraft({ ...branch })}
                >
                  <Pencil className="mr-1.5 size-3.5" aria-hidden="true" /> Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending || (branch.isMain && branch.isActive)}
                  onClick={() => void toggleActive(branch)}
                >
                  <Power className="mr-1.5 size-3.5" aria-hidden="true" />{" "}
                  {branch.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Building2
            className="mx-auto size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 font-medium">No branches yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a branch to begin managing locations.
          </p>
        </div>
      )}

      {draft ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) setDraft(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-dialog-title"
            className="my-auto w-full max-w-xl rounded-xl border bg-background p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5">
              <h3 id="branch-dialog-title" className="text-lg font-semibold">
                {draft.id ? "Edit branch" : "Add branch"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Branch codes must be unique.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSave}>
              <input type="hidden" name="id" value={draft.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  Branch name
                  <Input
                    name="name"
                    value={draft.name}
                    maxLength={120}
                    required
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Branch code
                  <Input
                    name="code"
                    value={draft.code}
                    maxLength={30}
                    required
                    onChange={(event) =>
                      setDraft({ ...draft, code: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Branch type
                  <select
                    name="type"
                    value={draft.type}
                    required
                    className={inputClass}
                    onChange={(event) =>
                      setDraft({ ...draft, type: event.target.value })
                    }
                  >
                    {BRANCH_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {BRANCH_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Contact number
                  <Input
                    name="contactNumber"
                    value={draft.contactNumber ?? ""}
                    maxLength={50}
                    onChange={(event) =>
                      setDraft({ ...draft, contactNumber: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  Email
                  <Input
                    name="email"
                    type="email"
                    value={draft.email ?? ""}
                    maxLength={120}
                    onChange={(event) =>
                      setDraft({ ...draft, email: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  Address
                  <textarea
                    name="address"
                    value={draft.address ?? ""}
                    rows={3}
                    className={`${inputClass} resize-y`}
                    onChange={(event) =>
                      setDraft({ ...draft, address: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    name="isMain"
                    checked={draft.isMain}
                    className="size-4 accent-amber-600"
                    onChange={(event) =>
                      setDraft({ ...draft, isMain: event.target.checked })
                    }
                  />
                  <span>
                    <span className="block font-medium">Main branch</span>
                    <span className="text-xs text-muted-foreground">
                      Only one branch can be designated as the main branch.
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={draft.isActive}
                    className="size-4 accent-amber-600"
                    onChange={(event) =>
                      setDraft({ ...draft, isActive: event.target.checked })
                    }
                  />
                  <span>
                    <span className="block font-medium">Active</span>
                    <span className="text-xs text-muted-foreground">
                      Available for operations.
                    </span>
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending} className="gap-2">
                  {draft.id ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  {pending ? "Saving…" : "Save branch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
