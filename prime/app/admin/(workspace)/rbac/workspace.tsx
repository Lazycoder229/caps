"use client"

import { useMemo, useState } from "react"
import {
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { ACCESS_PERMISSION_GROUPS } from "@/lib/database/access-control"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRoles } from "./hooks/use-roles"
import type { PermissionOption, RoleRow } from "./types"

type Draft = {
  id: string
  name: string
  description: string
  isSystem: boolean
  permissionIds: string[]
}

export function RolesWorkspace({
  roles,
  permissions,
}: {
  roles: RoleRow[]
  permissions: PermissionOption[]
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const { pending, save, remove } = useRoles()
  const permissionByCode = useMemo(
    () =>
      new Map(permissions.map((permission) => [permission.code, permission])),
    [permissions]
  )

  function newRole() {
    setDraft({
      id: "",
      name: "",
      description: "",
      isSystem: false,
      permissionIds: [],
    })
  }

  function editRole(role: RoleRow) {
    setDraft({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      isSystem: role.isSystem,
      permissionIds: role.permissionIds,
    })
  }

  function togglePermission(id: string, checked: boolean) {
    setDraft((current) => {
      if (!current) return current
      const selected = new Set(current.permissionIds)
      if (checked) selected.add(id)
      else selected.delete(id)
      return { ...current, permissionIds: [...selected] }
    })
  }

  function toggleGroup(codes: readonly string[], checked: boolean) {
    const ids = codes.flatMap((code) => {
      const permission = permissionByCode.get(code)
      return permission ? [permission.id] : []
    })
    setDraft((current) => {
      if (!current) return current
      const selected = new Set(current.permissionIds)
      for (const id of ids) {
        if (checked) selected.add(id)
        else selected.delete(id)
      }
      return { ...current, permissionIds: [...selected] }
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    const form = new FormData(event.currentTarget)
    form.set("id", draft.id)
    form.set("permissionIds", JSON.stringify(draft.permissionIds))
    const result = await save(form)
    if (result.ok) setDraft(null)
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles &amp; Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign system permissions to roles used by staff accounts.
          </p>
        </div>
        <Button size="sm" onClick={newRole}>
          <Plus className="mr-1 size-4" /> New role
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Roles" value={roles.length} icon={ShieldCheck} />
        <Summary
          label="Access permissions"
          value={permissions.length}
          icon={LockKeyhole}
        />
        <Summary
          label="Assigned staff"
          value={roles.reduce((sum, role) => sum + role.userCount, 0)}
          icon={Users}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Staff assigned</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{role.name}</div>
                    {role.description ? (
                      <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                        {role.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {role.permissionIds.length}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{role.userCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={role.isSystem ? "secondary" : "outline"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editRole(role)}
                      >
                        <Pencil className="mr-1 size-3.5" /> Edit access
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${role.name}`}
                        disabled={
                          pending || role.isSystem || role.userCount > 0
                        }
                        onClick={() =>
                          void remove({ id: role.id, name: role.name })
                        }
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!roles.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <ShieldCheck className="size-7 text-muted-foreground" />
                      <p className="mt-2 font-medium">No roles yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Create a role with the permissions your staff needs.
                      </p>
                      <Button size="sm" className="mt-3" onClick={newRole}>
                        <Plus className="mr-1 size-4" /> Create role
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {draft ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-form-title"
            className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b p-4">
              <div>
                <h2 id="role-form-title" className="font-semibold">
                  {draft.id ? `Edit ${draft.name}` : "Create role"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose which system permissions this role receives.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={pending}
                onClick={() => setDraft(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </header>
            <form
              onSubmit={(event) => void submit(event)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <input type="hidden" name="id" value={draft.id} />
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Role name</span>
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={50}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    disabled={draft.isSystem}
                    className="h-9 rounded-md border bg-background px-3 disabled:opacity-70"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium">Description</span>
                  <textarea
                    name="description"
                    maxLength={1000}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                    className="min-h-16 rounded-md border bg-background px-3 py-2"
                    placeholder="What this role is responsible for"
                  />
                </label>
                <input
                  type="hidden"
                  name="permissionIds"
                  value={JSON.stringify(draft.permissionIds)}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Permission access</h3>
                    <span className="text-xs text-muted-foreground">
                      {draft.permissionIds.length} selected
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {ACCESS_PERMISSION_GROUPS.map((group) => {
                      const groupPermissions = group.permissions.flatMap(
                        (permission) => {
                          const option = permissionByCode.get(permission.code)
                          return option
                            ? [{ ...permission, id: option.id }]
                            : []
                        }
                      )
                      if (!groupPermissions.length) return null
                      const allSelected = groupPermissions.every((permission) =>
                        draft.permissionIds.includes(permission.id)
                      )
                      return (
                        <fieldset
                          key={group.module}
                          className="rounded-lg border p-3"
                        >
                          <legend className="px-1 text-sm font-medium">
                            {group.module}
                          </legend>
                          <label className="mb-2 flex cursor-pointer items-center gap-2 border-b pb-2 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={(event) =>
                                toggleGroup(
                                  groupPermissions.map(
                                    (permission) => permission.code
                                  ),
                                  event.target.checked
                                )
                              }
                              className="size-3.5 accent-amber-600"
                            />
                            Select all
                          </label>
                          <div className="space-y-2">
                            {groupPermissions.map((permission) => (
                              <label
                                key={permission.id}
                                className="flex cursor-pointer items-start gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={draft.permissionIds.includes(
                                    permission.id
                                  )}
                                  onChange={(event) =>
                                    togglePermission(
                                      permission.id,
                                      event.target.checked
                                    )
                                  }
                                  className="mt-0.5 size-4 accent-amber-600"
                                />
                                <span>
                                  <span className="block">
                                    {permission.code
                                      .split(":")[1]
                                      .replaceAll("_", " ")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      )
                    })}
                  </div>
                </div>
              </div>
              <footer className="flex justify-end gap-2 border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save role"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof ShieldCheck
}) {
  return (
    <Card size="sm">
      <CardContent className="flex min-h-16 items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <strong className="text-lg tabular-nums">{value}</strong>
        </span>
      </CardContent>
    </Card>
  )
}
