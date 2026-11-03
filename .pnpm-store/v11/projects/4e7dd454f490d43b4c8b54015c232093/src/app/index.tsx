import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import * as SecureStore from "expo-secure-store"
import { CustomerSections } from "../components/customer-sections"
import { Text, TextInput } from "../components/app-typography"
import { CustomerMenu } from "../components/customer-menu"
import { TableQrScanner } from "../components/table-qr-scanner"
import { API_URL, api, type Catalog, type Customer, type DigitalReceipt, type PortalData } from "../lib/api"

const TOKEN_KEY = "prime.customer.api-token"

function getSavedToken() {
  return Platform.OS === "web"
    ? Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null)
    : SecureStore.getItemAsync(TOKEN_KEY)
}

function saveToken(value: string) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(TOKEN_KEY, value)
    return Promise.resolve()
  }
  return SecureStore.setItemAsync(TOKEN_KEY, value)
}

function removeSavedToken() {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(TOKEN_KEY)
    return Promise.resolve()
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY)
}

export default function CustomerHome() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [portal, setPortal] = useState<PortalData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [scannerOpen, setScannerOpen] = useState(false)
  const [guestKiosk, setGuestKiosk] = useState(false)
  const [tableId, setTableId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([api.catalog(), getSavedToken()])
      .then(async ([menu, savedToken]) => {
        if (!active) return
        setCatalog(menu)
        if (savedToken) {
          try {
            const result = await api.me(savedToken)
            const details = await api.portal(savedToken)
            if (!active) return
            setCustomer(result.customer)
            setPortal(details)
            setToken(savedToken)
          } catch {
            await removeSavedToken()
          }
        }
      })
      .catch((error: unknown) => {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to connect to the server."
          )
      })
    return () => {
      active = false
    }
  }, [])

  async function submitAuth() {
    setMessage("")
    if (mode === "register" && password !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }
    setBusy(true)
    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register({ name, email, contactNumber, password })
      await saveToken(result.token)
      setToken(result.token)
      setCustomer(result.customer)
      setPortal(await api.portal(result.token))
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in.")
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    const currentToken = token
    setToken(null)
    setCustomer(null)
    setPortal(null)
    await removeSavedToken()
    if (currentToken) void api.logout(currentToken).catch(() => undefined)
  }

  async function runPortalAction(payload: Record<string, unknown>): Promise<string | null> {
    if (!token) return "Sign in to continue."
    setBusy(true)
    setMessage("")
    try {
      if (payload.action === "receipt") {
        return "Open a paid order's Digital receipt button to view the receipt."
      } else if (payload.action === "paymentReference") {
        await Linking.openURL(`${API_URL}/customer/payment-reference/${encodeURIComponent(String(payload.token))}`)
      } else {
        const result = payload.action === "placeOrder"
          ? await api.createOrder(token, payload.order as Record<string, unknown>)
          : await api.portalAction(token, payload)
        if (result.ok === false) return result.message
        setMessage(result.message)
      }
      setPortal(await api.portal(token))
      const refreshed = await api.me(token)
      setCustomer(refreshed.customer)
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not complete request."
      setMessage(errorMessage)
      return errorMessage
    } finally { setBusy(false) }
  }

  async function getDigitalReceipt(orderId: string): Promise<DigitalReceipt | null> {
    if (!token) { setMessage("Sign in to view your receipt."); return null }
    try { return await api.receipt(token, orderId) }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load receipt."); return null }
  }

  async function refreshPortal(): Promise<string | null> {
    if (!token) return null
    setBusy(true)
    try {
      const previousPaid = new Set((portal?.orders ?? []).filter(order => order.paymentStatus === "paid").map(order => order.id))
      const refreshed = await api.portal(token)
      setPortal(refreshed)
      setCustomer((await api.me(token)).customer)
      setMessage("")
      return refreshed.orders.find(order => order.paymentStatus === "paid" && !previousPaid.has(order.id))?.id ?? null
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not refresh orders."); return null }
    finally { setBusy(false) }
  }

  async function runGuestOrder(payload: Record<string, unknown>): Promise<string | null> {
    setBusy(true)
    try {
      const result = await api.createOrder(null, payload.order as Record<string, unknown>)
      if (!result.ok) return result.message
      return null
    } catch (error) {
      return error instanceof Error ? error.message : "Could not place the order."
    } finally {
      setBusy(false)
    }
  }

  async function openTableMenu(nextTableId: string) {
    setTableId(nextTableId)
    setScannerOpen(false)
    setGuestKiosk(true)
    setMessage("")
    try {
      setCatalog(await api.catalog(nextTableId))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load the menu.")
    }
  }

  return (
    <View style={styles.screen}>
      {customer && portal ? (
        <CustomerSections data={portal} catalog={catalog} busy={busy} message={message} onAction={runPortalAction} onGetReceipt={getDigitalReceipt} onRefresh={refreshPortal} onSignOut={signOut} />
      ) : guestKiosk ? (
        <View style={styles.guestKiosk}>
          <View style={styles.guestHeader}>
            <Text style={styles.authEyebrow}>ORDER KIOSK</Text>
            <Pressable onPress={() => { setGuestKiosk(false); setTableId(null) }}><Text style={styles.authSwitchLink}>Sign in</Text></Pressable>
          </View>
          {catalog ? <CustomerMenu catalog={catalog} busy={busy} isAuthenticated={false} tableId={tableId} onOrder={runGuestOrder} /> : <ActivityIndicator color="#ff9900" />}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoPanel}><Text style={styles.logoWordmark}>PRIME</Text></View>
          <View style={styles.authContent}>
            {mode === "login" && <Text style={styles.welcomeMessage}>Welcome to PRIME!</Text>}
            <Text style={styles.authEyebrow}>{mode === "login" ? "CUSTOMER SIGN IN" : "CUSTOMER REGISTRATION"}</Text>
            <Text style={styles.authTitle}>{mode === "login" ? "Sign in to your account" : "Create your account"}</Text>
            <Text style={styles.authDescription}>{mode === "login" ? "Order your favorites, track your receipts, and manage your rewards." : "Keep your orders, digital receipts, and loyalty points together."}</Text>
            {mode === "login" && <View style={styles.diningCard}><Text style={styles.diningTitle}>Dining in?</Text><Text style={styles.muted}>Scan your table QR to browse and place a guest order. Sign in to save your order history and points.</Text><Pressable onPress={() => setScannerOpen(true)} style={styles.scanButton}><Text style={styles.scanButtonText}>▣  Scan a table QR</Text></Pressable></View>}
            {mode === "register" && <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />}
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {mode === "register" && <Field label="Mobile number (optional)" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />}
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            {mode === "register" && <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />}
            {!!message && <Text style={styles.error}>{message}</Text>}
            <Pressable disabled={busy} onPress={submitAuth} style={[styles.primaryButton, busy && styles.disabled]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{mode === "login" ? "Sign in" : "Create account"}</Text>}
            </Pressable>
            <Text style={styles.authSwitchText}>{mode === "login" ? "New here? " : "Already registered? "}<Text onPress={() => { setMode(mode === "login" ? "register" : "login"); setMessage("") }} style={styles.authSwitchLink}>{mode === "login" ? "Create an account" : "Sign in"}</Text></Text>
          </View>
        </ScrollView>
      )}
      <TableQrScanner visible={scannerOpen} onClose={() => setScannerOpen(false)} onTableScanned={openTableMenu} />
    </View>
  )
}

function Field(
  props: React.ComponentProps<typeof TextInput> & { label: string }
) {
  const { label, ...inputProps } = props
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#9a948a"
        style={styles.input}
        {...inputProps}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 36,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  logoPanel: { height: 124, marginHorizontal: -16, alignItems: "center", justifyContent: "center", backgroundColor: "#ff9900" },
  logoWordmark: { color: "#fffdf4", fontSize: 46, fontWeight: "900", letterSpacing: 1.5, textShadowColor: "rgba(112, 57, 0, .35)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 5 },
  authContent: { paddingTop: 32, paddingBottom: 20, alignSelf: "center", width: "100%", maxWidth: 510 },
  welcomeMessage: { color: "#171717", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  authEyebrow: { color: "#a95400", fontSize: 12, fontWeight: "700", letterSpacing: 2, marginBottom: 10 },
  authTitle: { color: "#171717", fontSize: 26, lineHeight: 32, fontWeight: "600" },
  authDescription: { color: "#737373", fontSize: 14, lineHeight: 23, marginTop: 8, marginBottom: 24 },
  authSwitchText: { color: "#737373", textAlign: "center", fontSize: 14, marginTop: 18 },
  authSwitchLink: { color: "#171717", fontWeight: "600", textDecorationLine: "underline" },
  muted: { color: "#737373", fontSize: 14, lineHeight: 22 },
  diningCard: { gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 14, marginBottom: 20 },
  diningTitle: { color: "#171717", fontSize: 16, fontWeight: "600" },
  scanButton: { minHeight: 44, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,153,0,.55)", borderRadius: 9, marginTop: 4 },
  scanButtonText: { color: "#171717", fontWeight: "600", fontSize: 14 },
  guestKiosk: { flex: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  guestHeader: { minHeight: 42, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  field: { marginBottom: 12 },
  fieldLabel: {
    color: "#171717",
    fontSize: 14,
    letterSpacing: 0,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#171717",
    fontSize: 14,
  },
  error: { color: "#a95400", fontSize: 14, marginBottom: 10 },
  primaryButton: {
    minHeight: 44,
    backgroundColor: "#ff9900",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  disabled: { opacity: 0.6 },
  primaryButtonText: { color: "#171717", fontSize: 14, fontWeight: "700" },
})


