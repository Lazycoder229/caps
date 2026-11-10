import { redirect } from "next/navigation"
import {
  fraunces,
  manrope,
  groups,
  steps,
  comparison,
  specs,
  faqs,
} from "./constant"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Scroll3DReveal } from "@/components/scroll-3d-reveal"
import { RestaurantScrollBot } from "@/components/restaurant-scroll-bot"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowRight,
  X,
  Check,
  GraduationCap,
  ScanLine,
  Sparkles,
  ReceiptText,
} from "lucide-react"

export default async function PrimeLanding({
  searchParams,
}: {
  searchParams?: Promise<{ tableId?: string | string[] }>
}) {
  const tableIdParam = (await searchParams)?.tableId
  const tableId = Array.isArray(tableIdParam) ? tableIdParam[0] : tableIdParam
  if (
    tableId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      tableId
    )
  ) {
    redirect(`/customer/kiosk?tableId=${encodeURIComponent(tableId)}`)
  }
  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} restaurant-landing relative min-h-screen overflow-x-clip bg-[#0c0d0c] text-[#EAF2FF]`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <RestaurantScrollBot />
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11110f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span
            className="text-xl tracking-[0.24em] text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            PRIME
          </span>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-cyan-200"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-cyan-200"
            >
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-cyan-200">
              FAQ
            </a>
            <a
              href="#try-ordering"
              className="transition-colors hover:text-cyan-200"
            >
              Try ordering
            </a>
          </nav>
          <Button
            asChild
            className="bg-cyan-200 text-slate-950 shadow-[0_0_24px_#67e8f955] transition-all hover:bg-cyan-100 hover:shadow-[0_0_34px_#67e8f988]"
          >
            <a href="/customer/kiosk">Open customer menu</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate border-b border-white/10 bg-[radial-gradient(ellipse_at_72%_35%,#e5d8c5_0%,#f1f0eb_34%,#f7f8f5_72%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(#c79b3b18_1px,transparent_1px),linear-gradient(90deg,#c79b3b18_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent)] [background-size:48px_48px] opacity-30"
        />
        <div className="mx-auto grid min-h-[690px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:gap-4 md:py-20 lg:px-12">
          <div className="relative z-10 max-w-xl">
            <Badge className="mb-6 gap-2 border border-cyan-200/25 bg-cyan-200/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-200/10">
              <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" />
              Restaurant operations, connected
            </Badge>
            <h1
              className="text-5xl leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              A smarter way
              <br />
              to serve<span className="text-cyan-300">.</span>
              <br />
              <span className="bg-gradient-to-r from-[#b88418] via-[#e0b84f] to-[#f0d98b] bg-clip-text text-transparent">
                Built around PRIME.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              QR ordering for guests. Clear tools for staff. One connected
              workspace for the people who keep every shift moving.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-full bg-cyan-200 px-6 text-slate-950 shadow-[0_0_30px_#67e8f944] transition-all hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-[0_0_42px_#67e8f977]"
              >
                <a href="/customer/kiosk">
                  Explore the menu <ArrowRight className="ml-2 size-4" />
                </a>
              </Button>
              <a
                href="#features"
                className="group inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                Explore the platform{" "}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
              <span>Guest ordering</span>
              <span>Staff tools</span>
              <span>Store insights</span>
            </div>
          </div>

          <Scroll3DReveal
            className="relative mx-auto w-full max-w-[42rem]"
            direction="right"
            delay={100}
          >
            <div className="hero-stage relative mx-auto aspect-square w-full max-w-[40rem]">
              <div
                aria-hidden
                className="hero-orbit absolute inset-[8%] rounded-full border border-cyan-200/20"
              />
              <div
                aria-hidden
                className="hero-orbit hero-orbit-delayed absolute inset-[16%] rounded-full border border-dashed border-sky-100/15"
              />
              <div
                aria-hidden
                className="hero-glow absolute inset-[17%] rounded-full bg-cyan-300/10 blur-3xl"
              />

              <div className="hero-float absolute top-[7%] left-1/2 z-10 w-[76%] max-w-[25rem] -translate-x-1/2 rotate-[-3deg] overflow-hidden rounded-[1.75rem] border border-white/15 bg-slate-900/90 p-2 shadow-[0_35px_100px_#0009] backdrop-blur-xl">
                <div className="rounded-[1.25rem] bg-[#fbfaf6] px-6 py-6 text-slate-900 sm:px-8 sm:py-7">
                  <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.24em] text-amber-700 uppercase">PRIME · DIGITAL RECEIPT</p>
                      <p className="mt-1 text-lg font-bold">Order complete</p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-5" />
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                    <span>ORDER #PM-2048</span><span>TABLE 08</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><span>Signature Litson Manok <span className="text-slate-400">× 1</span></span><span>₱420</span></div>
                    <div className="flex justify-between gap-4"><span>Garlic rice <span className="text-slate-400">× 2</span></span><span>₱80</span></div>
                    <div className="flex justify-between gap-4"><span>Iced calamansi <span className="text-slate-400">× 2</span></span><span>₱120</span></div>
                  </div>
                  <div className="mt-5 flex justify-between border-t border-dashed border-slate-300 pt-4 text-sm text-slate-500"><span>Total paid</span><span className="font-semibold text-slate-900">₱620.00</span></div>
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-700">
                    <ReceiptText className="size-4" /> Saved to your digital receipts
                  </div>
                </div>
              </div>

              <div className="hero-float absolute bottom-[14%] left-[2%] z-20 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/90 px-3 py-2.5 shadow-xl backdrop-blur-xl sm:left-[3%]">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-200 to-blue-400 text-slate-950">
                  <ReceiptText className="size-4" />
                </span>
                <div>
                  <p className="text-[9px] tracking-[0.16em] text-slate-400 uppercase">Paperless checkout</p>
                  <p className="mt-0.5 text-xs font-semibold text-white">Your receipt, always handy.</p>
                </div>
              </div>
              <div
                aria-hidden
                className="absolute top-[20%] right-[17%] size-2 rounded-full bg-cyan-200 shadow-[0_0_20px_8px_#67e8f955]"
              />
            </div>
          </Scroll3DReveal>
        </div>
      </section>

      {/* Problem / solution */}
      <section className="border-t border-white/10 bg-[#14130f]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2
            className="mb-14 border-b border-white/10 pb-4 text-3xl text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            What service looks like without it
          </h2>
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <span className="hidden text-sm font-medium text-slate-400 md:block">
              Without PRIME
            </span>
            <span className="hidden text-sm font-medium text-cyan-200 md:block">
              With PRIME
            </span>
            {comparison.map((row, index) => (
              <div
                key={row.before}
                className="grid gap-x-10 md:col-span-2 md:grid-cols-2"
              >
                <Scroll3DReveal delay={index * 70} direction="left">
                  <div className="flex gap-3 border-t border-white/10 pt-6 md:border-t">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <p className="text-slate-400">{row.before}</p>
                  </div>
                </Scroll3DReveal>
                <Scroll3DReveal delay={index * 70 + 80} direction="right">
                  <div className="flex gap-3 border-t border-white/10 pt-6">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <p className="text-slate-100">{row.after}</p>
                  </div>
                </Scroll3DReveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature groups */}
      <section id="features" className="border-t border-white/10 bg-[#0d0f0e]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 flex items-end justify-between border-b border-white/10 pb-4">
            <h2
              className="text-3xl text-white"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              One system for the whole shift
            </h2>
            <span className="hidden text-sm text-cyan-200/70 md:inline">
              11 features, grouped by who uses them
            </span>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {groups.map((group, index) => (
              <Scroll3DReveal
                key={group.label}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 shadow-[0_16px_50px_#0003] transition-colors hover:border-cyan-200/25 hover:bg-white/[0.04]"
                delay={index * 100}
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <h3
                  className="text-lg"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                >
                  {group.label}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {group.description}
                </p>
                <ul className="mt-6 space-y-6">
                  {group.items.map(({ icon: Icon, title, detail }) => (
                    <li key={title} className="flex gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                      <div>
                        <p className="font-medium text-slate-100">{title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">
                          {detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Scroll3DReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2
          className="mb-14 border-b border-white/10 pb-4 text-3xl text-white"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          From scan to receipt
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => (
            <Scroll3DReveal
              key={step.n}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.01] p-5"
              delay={index * 80}
              direction={index % 2 === 0 ? "left" : "right"}
            >
              <span
                className="text-sm text-cyan-300"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                {step.n}
              </span>
              <p className="mt-3 font-medium text-slate-100">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {step.detail}
              </p>
            </Scroll3DReveal>
          ))}
        </div>
      </section>

      {/* Under the hood */}
      <section className="border-t border-white/10 bg-[#14130f]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2
            className="mb-14 border-b border-white/10 pb-4 text-3xl text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            Under the hood
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {specs.map((spec, index) => (
              <Scroll3DReveal
                key={spec.label}
                className="flex flex-col gap-1 border-b border-white/10 pb-6 md:flex-row md:gap-6"
                delay={index * 70}
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <span
                  className="w-40 shrink-0 text-sm text-cyan-200/70"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  <code className="rounded bg-cyan-100/10 px-1.5 py-0.5 text-xs text-cyan-100">
                    {spec.label}
                  </code>
                </span>
                <p className="text-slate-300">{spec.value}</p>
              </Scroll3DReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-20">
        <h2
          className="mb-10 border-b border-white/10 pb-4 text-3xl text-white"
          style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
        >
          Common questions
        </h2>
        <Accordion
          type="single"
          className="w-full max-w-none rounded-2xl border border-white/10 bg-white/[0.02] px-5"
        >
          {faqs.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="border-white/10"
            >
              <AccordionTrigger className="text-left text-slate-100 hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* About the project */}
      <section className="border-t border-white/10 bg-[#0d0f0e]">
        <Scroll3DReveal className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Badge className="mb-6 border border-white/10 bg-white/5 text-cyan-100 hover:bg-white/5">
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Capstone project
          </Badge>
          <h2
            className="text-2xl"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            PRIME — Point-of-sale Restaurant Integrated Management Ecosystem
          </h2>
          <p className="mt-4 text-slate-400">
            A restaurant POS project combining QR ordering, cashier workflows,
            menu and inventory management, employee tools, and sales reporting.
          </p>
        </Scroll3DReveal>
      </section>

      {/* CTA */}
      <section
        id="try-ordering"
        className="border-t border-white/10 bg-[radial-gradient(ellipse_at_70%_50%,#e9dfd0_0%,#f5f6f3_65%)]"
      >
        <Scroll3DReveal className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2
              className="text-3xl text-white"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
            >
              Explore the customer ordering flow
            </h2>
            <p className="mt-2 text-slate-300">
              Open the customer menu and see how QR ordering works.
            </p>
          </div>
          <Button
            size="lg"
            asChild
            className="shrink-0 rounded-full bg-cyan-200 text-slate-950 shadow-[0_0_28px_#67e8f944] hover:bg-cyan-100"
          >
            <a href="/customer/kiosk">
              Try customer ordering
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </Scroll3DReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0d0f0e]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <span
              className="text-lg tracking-[0.2em] text-white"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              PRIME
            </span>
            <p className="mt-2 max-w-xs text-sm text-slate-400">
              Point-of-sale Restaurant Integrated Management Ecosystem — QR
              ordering, cashier tools, inventory, and staff management.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-cyan-200">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-cyan-200">
                  How it works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-cyan-200">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Project</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <a href="#try-ordering" className="hover:text-cyan-200">
                  Try ordering
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-slate-500">
            © 2026 PRIMEOS
          </div>
        </div>
      </footer>
    </div>
  )
}

