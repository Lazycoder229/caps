import Image from "next/image"

export function AuthSplitLayout({
  eyebrow,
  welcomeMessage,
  title,
  description,
  children,
}: {
  eyebrow: string
  welcomeMessage?: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[58.333333%_41.666667%]">
      <aside
        aria-label="PRIME"
        className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-[#ffd54d] sm:min-h-[280px] lg:min-h-svh"
      >
        <Image
          src="/prime-login-branding.svg"
          alt="PRIME"
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 58vw"
          className="object-contain"
        />
      </aside>

      <section className="flex min-h-[calc(100svh-220px)] items-center justify-center px-6 py-10 sm:min-h-[calc(100svh-280px)] sm:px-10 lg:min-h-svh lg:px-12 xl:px-16">
        <div className="w-full max-w-[510px]">
          {welcomeMessage ? (
            <p className="mb-3 text-lg font-semibold text-foreground">
              {welcomeMessage}
            </p>
          ) : null}
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e87500]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-2 mb-6 text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
          {children}
        </div>
      </section>
    </main>
  )
}
