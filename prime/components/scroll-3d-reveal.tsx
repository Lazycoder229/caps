"use client"

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"

type Scroll3DRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "left" | "right" | "center"
}

export function Scroll3DReveal({
  children,
  className,
  delay = 0,
  direction = "center",
}: Scroll3DRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      element.classList.add("scroll-3d-visible")
      return
    }

    element.classList.add("scroll-3d-ready")
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("scroll-3d-visible")
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const rotateY =
    direction === "left" ? "8deg" : direction === "right" ? "-8deg" : "0deg"
  const style = {
    "--reveal-delay": `${delay}ms`,
    "--reveal-rotate-y": rotateY,
  } as CSSProperties

  return (
    <div
      ref={ref}
      className={`scroll-3d-reveal${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  )
}
