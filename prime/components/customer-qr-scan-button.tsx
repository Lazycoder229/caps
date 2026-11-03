"use client"

import { useState } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableQrScanner } from "@/app/customer/(portal)/kiosk/table-qr-scanner"

export function CustomerQrScanButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full border-amber-500/40 hover:bg-amber-500/10"
        onClick={() => setOpen(true)}
      >
        <Camera className="size-4" />
        Scan a table QR
      </Button>
      {open ? <TableQrScanner onClose={() => setOpen(false)} /> : null}
    </>
  )
}
