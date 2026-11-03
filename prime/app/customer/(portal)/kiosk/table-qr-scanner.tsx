"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type DetectedCode = { rawValue?: string }
type Detector = { detect: (source: HTMLVideoElement) => Promise<DetectedCode[]> }
type DetectorConstructor = new (options: { formats: string[] }) => Detector

function getTableId(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return null
    if (url.pathname !== "/" && url.pathname !== "/customer/kiosk") return null
    const tableId = url.searchParams.get("tableId")
    return tableId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tableId)
      ? tableId
      : null
  } catch {
    return null
  }
}

export function TableQrScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState("Starting camera…")
  const [error, setError] = useState("")

  useEffect(() => {
    let stopped = false
    let stream: MediaStream | null = null
    let interval: ReturnType<typeof setInterval> | undefined

    async function start() {
      const DetectorApi = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector
      if (!DetectorApi) {
        setError("Live QR scanning is not supported in this browser. Scan the table QR with your phone’s camera app, then open the menu link.")
        setStatus("")
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is unavailable. Scan the table QR with your phone’s camera app instead.")
        setStatus("")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const detector = new DetectorApi({ formats: ["qr_code"] })
        setStatus("Point your camera at a table QR code")
        let scanning = false
        interval = setInterval(async () => {
          if (stopped || scanning || !videoRef.current || videoRef.current.readyState < 2) return
          scanning = true
          try {
            const codes = await detector.detect(videoRef.current)
            for (const code of codes) {
              const tableId = code.rawValue ? getTableId(code.rawValue) : null
              if (!tableId) continue
              stopped = true
              setStatus("Table found. Opening menu…")
              stream?.getTracks().forEach((track) => track.stop())
              router.push(`/customer/kiosk?tableId=${encodeURIComponent(tableId)}`)
              break
            }
          } catch {
            // Keep scanning while the camera adjusts focus.
          } finally {
            scanning = false
          }
        }, 250)
      } catch (cause) {
        const name = cause instanceof DOMException ? cause.name : ""
        setError(name === "NotAllowedError"
          ? "Camera permission was blocked. Allow camera access, or scan the table QR with your phone’s camera app."
          : "Could not start the camera. Scan the table QR with your phone’s camera app instead.")
        setStatus("")
      }
    }

    void start()
    return () => {
      stopped = true
      if (interval) clearInterval(interval)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [router])

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto bg-black/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="table-scan-title" className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 id="table-scan-title" className="font-semibold">Scan a table QR</h2>
            <p className="text-xs text-muted-foreground">Opens the menu for that table</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close QR scanner"><X /></Button>
        </div>
        <div className="space-y-3 p-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} className="size-full object-cover" playsInline muted />
            <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />
            {!error ? <p className="absolute right-2 bottom-2 left-2 rounded-md bg-black/65 px-2 py-1 text-center text-xs text-white">{status}</p> : null}
            {error ? <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white"><Camera className="mb-2 size-8" /><span>{error}</span></div> : null}
          </div>
          <p className="text-center text-xs text-muted-foreground">You can scan and browse before signing in. Sign in only when you’re ready to place an order.</p>
        </div>
      </section>
    </div>
  )
}
