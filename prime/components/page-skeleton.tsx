import { Skeleton } from "@/components/ui/skeleton"

type PageSkeletonProps = {
  variant?: "workspace" | "content" | "auth" | "kiosk" | "kiosk-content"
}

export function PageSkeleton({ variant = "workspace" }: PageSkeletonProps) {
  return (
    <main role="status" aria-label="Loading page" aria-busy="true">
      <span className="sr-only">Loading page…</span>
      {variant === "auth" ? <AuthSkeleton /> : null}
      {variant === "kiosk" ? <KioskSkeleton /> : null}
      {variant === "kiosk-content" ? <KioskContentSkeleton /> : null}
      {variant === "content" ? <WorkspaceContentSkeleton /> : null}
      {variant === "workspace" ? <WorkspaceSkeleton /> : null}
    </main>
  )
}

function WorkspaceContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6 p-2 sm:p-4">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-52 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-svh bg-background">
      <aside
        aria-hidden="true"
        className="hidden w-64 shrink-0 flex-col gap-6 border-r p-4 md:flex"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3 border-t pt-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header
          aria-hidden="true"
          className="flex h-14 items-center gap-3 border-b px-4"
        >
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="ml-auto size-8 rounded-full" />
        </header>
        <div aria-hidden="true" className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-2">
            <Skeleton className="h-7 w-52 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function AuthSkeleton() {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[58.333333%_41.666667%]">
      <div
        aria-hidden="true"
        className="hidden bg-red-600 lg:block"
      />
      <section
        aria-hidden="true"
        className="flex min-h-svh items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16"
      >
        <div className="w-full max-w-[510px] space-y-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
      </section>
    </div>
  )
}

function KioskSkeleton() {
  return (
    <div className="min-h-svh bg-muted/20 px-3 py-4 sm:px-6">
      <div aria-hidden="true" className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-2">
            <Skeleton className="h-7 w-48 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border bg-card">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="grid gap-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KioskContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border bg-card">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="grid gap-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
