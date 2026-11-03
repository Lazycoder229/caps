import { useCallback, useState } from "react"
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera"
import { Modal, Pressable, StyleSheet, View } from "react-native"
import { API_URL } from "../lib/api"
import { Text } from "./app-typography"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function tableIdFromQr(raw: string) {
  try {
    const url = new URL(raw, API_URL)
    if (url.origin !== new URL(API_URL).origin) return null
    if (url.pathname !== "/" && url.pathname !== "/customer/kiosk") return null
    const tableId = url.searchParams.get("tableId")
    return tableId && uuidPattern.test(tableId) ? tableId : null
  } catch {
    return null
  }
}

export function TableQrScanner({
  visible,
  onClose,
  onTableScanned,
}: {
  visible: boolean
  onClose: () => void
  onTableScanned: (tableId: string) => void
}) {
  const [permission, requestPermission] = useCameraPermissions()
  const [message, setMessage] = useState("")
  const [scanning, setScanning] = useState(false)

  const onBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (scanning) return
    const tableId = tableIdFromQr(result.data)
    if (!tableId) {
      setMessage("That QR code is not a PRIME table QR. Try again.")
      return
    }
    setScanning(true)
    setMessage("Table found. Opening menu…")
    onTableScanned(tableId)
  }, [onTableScanned, scanning])

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scan a table QR</Text>
            <Text style={styles.subtitle}>Opens the menu for that table</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        {!permission ? (
          <Text style={styles.help}>Checking camera permission…</Text>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.help}>Allow camera access to scan a table QR.</Text>
            <Pressable onPress={() => void requestPermission()} style={styles.button}>
              <Text style={styles.buttonText}>Allow camera</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.preview}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanning ? undefined : onBarcodeScanned}
            />
            <View pointerEvents="none" style={styles.scanFrame} />
            <Text style={styles.status}>{message || "Point your camera at a table QR code"}</Text>
          </View>
        )}
        <Text style={styles.footer}>You can scan and browse before signing in. Sign in only when you’re ready to place an order.</Text>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 56, gap: 22 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#171717", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#737373", marginTop: 4 },
  close: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  closeText: { color: "#171717", fontSize: 32, lineHeight: 36 },
  preview: { width: "100%", aspectRatio: 1, overflow: "hidden", borderRadius: 18, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  scanFrame: { width: "70%", aspectRatio: 1, borderWidth: 3, borderColor: "#fff", borderRadius: 20 },
  status: { position: "absolute", bottom: 14, left: 12, right: 12, overflow: "hidden", borderRadius: 8, padding: 10, textAlign: "center", color: "#fff", backgroundColor: "rgba(0,0,0,.7)" },
  permissionBox: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 14 },
  help: { color: "#737373", textAlign: "center", lineHeight: 21 },
  button: { backgroundColor: "#ff9900", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 9 },
  buttonText: { color: "#171717", fontWeight: "700" },
  footer: { color: "#737373", textAlign: "center", lineHeight: 20, fontSize: 12 },
})
