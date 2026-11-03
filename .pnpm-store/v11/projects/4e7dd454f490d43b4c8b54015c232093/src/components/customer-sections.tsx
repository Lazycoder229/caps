import { useState, type ComponentProps } from "react"
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import * as Location from "expo-location"
import { StatusBar } from "expo-status-bar"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { API_URL, type Catalog, type DigitalReceipt, type PortalData, type SavedDeliveryAddress } from "../lib/api"
import { normalizeAddressText } from "../lib/address"
import { CustomerMenu } from "./customer-menu"
import DeliveryMap from "./delivery-map"
import { Text, TextInput } from "./app-typography"

const fmt = (v: number) => new Intl.NumberFormat("en-PH").format(v)
const money = (v: number) => `₱${Number(v ?? 0).toFixed(2)}`
function orderFilterLabel(status: string, orders: PortalData["orders"]) {
  const hasDelivery = orders.some((order) => order.orderType === "delivery")
  const hasOtherOrders = orders.some((order) => order.orderType !== "delivery")
  if (status === "served") {
    if (!hasDelivery) return "Served"
    return hasOtherOrders ? "Served / On the way" : "On the way"
  }
  if (status === "completed") {
    if (!hasDelivery) return "Completed"
    return hasOtherOrders ? "Completed / Received" : "Order received"
  }
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"
}
type AddressLabel = SavedDeliveryAddress["label"]
type DeliveryAddressDraft = Omit<SavedDeliveryAddress, "isDefault">
const blankDeliveryAddress = (label: AddressLabel): DeliveryAddressDraft => ({ label, recipientName: "", contactNumber: "", address: "", latitude: null, longitude: null, instructions: "" })
type Props = { data: PortalData; catalog: Catalog | null; busy: boolean; message: string; onAction: (payload: Record<string, unknown>) => Promise<string | null>; onGetReceipt: (orderId: string) => Promise<DigitalReceipt | null>; onRefresh: () => Promise<string | null>; onSignOut: () => void }

export function CustomerSections({ data, catalog, busy, message, onAction, onGetReceipt, onRefresh, onSignOut }: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(data.customer.name)
  const [email, setEmail] = useState(data.customer.email ?? "")
  const [phone, setPhone] = useState(data.customer.contactNumber ?? "")
  const [deliveryAddresses, setDeliveryAddresses] = useState<Record<AddressLabel, DeliveryAddressDraft>>({ home: blankDeliveryAddress("home"), work: blankDeliveryAddress("work") })
  const [defaultDeliveryAddress, setDefaultDeliveryAddress] = useState<AddressLabel | null>(null)
  const [addressMapBusy, setAddressMapBusy] = useState<AddressLabel | null>(null)
  const [addressMapError, setAddressMapError] = useState("")
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const [receipt, setReceipt] = useState<DigitalReceipt | null>(null)
  const [receiptBusy, setReceiptBusy] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("18:00")
  const [guests, setGuests] = useState("2")
  const [notes, setNotes] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [orderFilter, setOrderFilter] = useState("pending")
  const [reservationFilter, setReservationFilter] = useState<"upcoming" | "history" | "all">("upcoming")
  const [tab, setTab] = useState<"home" | "menu" | "cart" | "checkout" | "orders" | "reservations" | "rewards" | "more">("home")
  const isCheckout = tab === "checkout"
  const [orderIntent, setOrderIntent] = useState<"counter" | "qr" | "delivery">("counter")
  const [orderIntentKey, setOrderIntentKey] = useState(0)
  const tabs: { key: typeof tab; title: string; icon: ComponentProps<typeof Ionicons>["name"] }[] = [
    { key: "home", title: "Home", icon: "home-outline" },
    { key: "menu", title: "Menu", icon: "restaurant-outline" },
    { key: "cart", title: "Cart", icon: "cart-outline" },
    { key: "more", title: "More", icon: "ellipsis-horizontal-circle-outline" },
  ]
  const activeTitle = tabs.find(item => item.key === tab)?.title ?? (tab === "checkout" ? "Checkout" : tab === "orders" ? "Order history" : tab === "reservations" ? "Reservations" : tab === "rewards" ? "Points & rewards" : "Home")
  const todayInManila = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  const orderStatuses = ["pending", "preparing", "ready", "served", "completed", "cancelled"]
  const orders = Array.isArray(data.orders)
    ? data.orders
        .filter((order) => order && typeof order === "object")
        .map((order) => ({
          ...order,
          status: String(order.status ?? ""),
          paymentStatus: String(order.paymentStatus ?? ""),
          paymentMethod: typeof order.paymentMethod === "string" ? order.paymentMethod : null,
          items: Array.isArray(order.items)
            ? order.items.filter((item) => item && typeof item === "object")
            : [],
        }))
    : []
  const visibleOrders = orders.filter(order => order.status === orderFilter)
  const upcomingReservations = (r: PortalData["reservations"][number]) => (r.reservationDate > todayInManila || (r.reservationDate === todayInManila && r.reservationTime > new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()))) && ["pending", "confirmed"].includes(r.status)
  async function changePassword() {
    setPasswordFeedback("")
    if (newPassword.length < 8) return setPasswordFeedback("New password must be at least 8 characters.")
    if (newPassword !== confirmPassword) return setPasswordFeedback("New passwords do not match.")
    const error = await onAction({ action: "changePassword", newPassword, confirmPassword })
    if (error) setPasswordFeedback(error)
    else {
      setNewPassword("")
      setConfirmPassword("")
      setPasswordFeedback("Your password has been changed.")
    }
  }
  function openProfileEditor() {
    setName(data.customer.name)
    setEmail(data.customer.email ?? "")
    setPhone(data.customer.contactNumber ?? "")
    const saved = data.deliveryAddresses ?? []
    setDeliveryAddresses({
      home: { ...blankDeliveryAddress("home"), ...saved.find((address) => address.label === "home"), address: normalizeAddressText(saved.find((address) => address.label === "home")?.address ?? "") },
      work: { ...blankDeliveryAddress("work"), ...saved.find((address) => address.label === "work"), address: normalizeAddressText(saved.find((address) => address.label === "work")?.address ?? "") },
    })
    setDefaultDeliveryAddress(saved.find((address) => address.isDefault)?.label ?? null)
    setAddressMapError("")
    setProfileFeedback("")
    setProfileEditorOpen(true)
  }
  async function saveProfile() {
    setProfileFeedback("")
    const savedAddresses = ([deliveryAddresses.home, deliveryAddresses.work] as const).map((address) => ({ ...address, address: normalizeAddressText(address.address) })).filter((address) => address.recipientName.trim() || address.contactNumber.trim() || address.address.trim() || address.instructions?.trim() || address.latitude != null || address.longitude != null)
    const error = await onAction({ action: "profile", name, email, contactNumber: phone, deliveryAddresses: savedAddresses, defaultDeliveryAddress })
    if (error) setProfileFeedback(error)
    else setProfileFeedback("Your profile has been updated.")
  }
  function updateDeliveryAddress(label: AddressLabel, field: keyof DeliveryAddressDraft, value: string | number | null) {
    setDeliveryAddresses((current) => ({ ...current, [label]: { ...current[label], [field]: value } }))
  }
  async function selectSavedAddressLocation(label: AddressLabel, latitude: number, longitude: number) {
    updateDeliveryAddress(label, "latitude", latitude)
    updateDeliveryAddress(label, "longitude", longitude)
    if (Platform.OS === "web") {
      setAddressMapError("Pin saved. Enter the street and barangay manually; automatic address lookup is not configured for web yet.")
      return
    }
    try {
      const place = (await Location.reverseGeocodeAsync({ latitude, longitude }))[0]
      if (!place) return
      const parts = [place.name, place.street, place.district, place.city, place.region]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
      const address = [...new Set(parts)].join(", ")
      if (address) updateDeliveryAddress(label, "address", normalizeAddressText(address))
    } catch {
      // Keep the selected coordinates if reverse geocoding is unavailable.
    }
  }
  async function getCurrentAddressLocation(label: AddressLabel) {
    setAddressMapBusy(label)
    setAddressMapError("")
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) { setAddressMapError("Allow location access or tap the map to set this address pin."); return }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
      await selectSavedAddressLocation(label, location.coords.latitude, location.coords.longitude)
      if (location.coords.accuracy != null && location.coords.accuracy > 1000) {
        setAddressMapError(`Your device's location is approximate (±${(location.coords.accuracy / 1000).toFixed(1)} km). Move the pin manually for a more accurate address.`)
      }
    } catch { setAddressMapError("Could not get your location. Tap the map to set this address pin.") }
    finally { setAddressMapBusy(null) }
  }
  async function showReceipt(orderId: string) {
    setReceiptBusy(true)
    try { setReceipt(await onGetReceipt(orderId)) }
    finally { setReceiptBusy(false) }
  }
  async function refreshOrders() { const newlyPaidOrderId = await onRefresh(); if (newlyPaidOrderId) await showReceipt(newlyPaidOrderId) }
  return <View style={s.screen}>
    <StatusBar style="dark" />
    <View style={{ height: insets.top, backgroundColor: "#ff9900" }} />
    <View style={s.appHeader}><Text style={s.appHeaderTitle}>{profileEditorOpen ? "Edit profile" : activeTitle}</Text></View>
    <View style={[s.menuScreen, tab !== "menu" && tab !== "cart" && tab !== "checkout" && s.hiddenScreen]}><CustomerMenu catalog={catalog} busy={busy} isAuthenticated customerName={data.customer.name} customerPhone={data.customer.contactNumber ?? ""} deliveryAddresses={data.deliveryAddresses ?? []} defaultDeliveryAddress={data.deliveryAddresses?.find((address) => address.isDefault)?.label ?? null} initialOrderType={orderIntent} orderIntentKey={orderIntentKey} cartPageVisible={tab === "cart"} checkoutPageVisible={isCheckout} onOpenCartPage={() => setTab("cart")} onOpenCheckout={() => setTab("checkout")} onBackToCart={() => setTab("cart")} onBackToMenu={() => setTab("menu")} onOrderSuccess={() => { setOrderFilter("pending"); setTab("orders"); void refreshOrders() }} onOrder={onAction} /></View>
    <View style={[s.contentScreen, (tab === "menu" || tab === "cart" || tab === "checkout") && s.hiddenScreen]}><ScrollView style={s.scroll} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        {profileEditorOpen && <View style={s.profileEditor}><Text style={s.body}>Update your name, email, and mobile number.</Text><Text style={s.fieldLabel}>Full name</Text><TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} autoComplete="name"/><Text style={s.fieldLabel}>Email</Text><TextInput style={s.input} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"/><Text style={s.fieldLabel}>Mobile number</Text><TextInput style={s.input} placeholder="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel"/><View style={s.savedAddresses}><Text style={s.cardTitle}>Saved delivery addresses</Text><Text style={s.body}>Save Home and Work addresses to prefill delivery checkout.</Text><ProfileDeliveryAddressEditor label="home" value={deliveryAddresses.home} isDefault={defaultDeliveryAddress==="home"} mapBusy={addressMapBusy==="home"} mapError={addressMapError} onChange={(field,value)=>updateDeliveryAddress("home",field,value)} onPin={(latitude,longitude)=>void selectSavedAddressLocation("home",latitude,longitude)} onCurrentLocation={()=>void getCurrentAddressLocation("home")} onSetDefault={()=>setDefaultDeliveryAddress("home")}/><ProfileDeliveryAddressEditor label="work" value={deliveryAddresses.work} isDefault={defaultDeliveryAddress==="work"} mapBusy={addressMapBusy==="work"} mapError={addressMapError} onChange={(field,value)=>updateDeliveryAddress("work",field,value)} onPin={(latitude,longitude)=>void selectSavedAddressLocation("work",latitude,longitude)} onCurrentLocation={()=>void getCurrentAddressLocation("work")} onSetDefault={()=>setDefaultDeliveryAddress("work")}/></View>{!!profileFeedback && <Text style={profileFeedback === "Your profile has been updated." ? s.success : s.errorText}>{profileFeedback}</Text>}<Button title={busy ? "Saving…" : "Save profile"} disabled={busy || !name.trim() || !email.trim()} onPress={() => void saveProfile()}/><View style={s.passwordEditorSection}><Text style={s.cardTitle}>Change password</Text><View style={s.passwordInputWrap}><TextInput style={[s.input, s.passwordInput]} placeholder="New password (at least 8 characters)" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} autoComplete="new-password" textContentType="newPassword"/><Pressable accessibilityRole="button" accessibilityLabel={showNewPassword ? "Hide new password" : "Show new password"} onPress={() => setShowNewPassword(value => !value)} style={s.passwordEye}><Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#737373"/></Pressable></View><View style={s.passwordInputWrap}><TextInput style={[s.input, s.passwordInput]} placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoComplete="new-password" textContentType="newPassword"/><Pressable accessibilityRole="button" accessibilityLabel={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} onPress={() => setShowConfirmPassword(value => !value)} style={s.passwordEye}><Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#737373"/></Pressable></View>{!!passwordFeedback && <Text style={passwordFeedback === "Your password has been changed." ? s.success : s.errorText}>{passwordFeedback}</Text>}<Button title="Update password" disabled={busy || !newPassword || !confirmPassword} onPress={() => void changePassword()}/></View><Pressable accessibilityRole="button" onPress={() => setProfileEditorOpen(false)} style={s.cancelButton}><Text style={s.cancelButtonText}>Back</Text></Pressable></View>}
    {!!message && <Text style={s.message}>{message}</Text>}
    {tab === "home" && <View style={s.stack}><HomeLanding catalog={catalog} onMenu={() => setTab("menu")} onOrderType={(type) => { setOrderIntent(type); setOrderIntentKey(value => value + 1); setTab("menu") }}/><View style={s.metrics}>{[["Points available", fmt(data.customer.loyaltyPointsBalance ?? 0), "pts"], ["Points accumulated", fmt(data.earnedPoints), "pts"], ["Completed orders", String(orders.filter(o => o.status === "completed").length), ""], ["Rewards available", String(data.rewards.length), ""]].map(([label, value, suffix]) => <View key={label} style={s.metric}><Text style={s.body}>{label}</Text><Text style={s.metricValue}>{value}<Text style={s.metricSuffix}>{suffix ? ` ${suffix}` : ""}</Text></Text></View>)}</View><View style={s.card}><View style={s.cardHeader}><Text style={s.cardTitle}>Recent orders</Text><Text onPress={() => setTab("orders")} style={s.link}>View history</Text></View>{orders.slice(0, 5).length ? orders.slice(0, 5).map(order => <View key={order.id} style={s.orderRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{order.orderNumber}</Text><Text style={s.body}>{new Date(order.createdAt).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}</Text></View><Text style={s.rowTitle}>{money(order.total)}</Text><Text style={s.badge}>{order.orderType === "delivery" ? deliveryStageLabel(order.delivery?.status ?? "pending") : statusLabel(order.status)}</Text></View>) : <Text style={s.body}>No orders yet. Browse the menu to place your first order.</Text>}</View><View style={s.card}><Text style={s.cardTitle}>Loyalty rewards</Text><Text style={s.body}>Earn points when a paid order is completed. Redeem your points for the rewards configured by PRIME.</Text><View style={s.balance}><Text style={s.body}>Your current balance</Text><Text style={s.metricValue}>{fmt(data.customer.loyaltyPointsBalance ?? 0)} pts</Text></View><Text onPress={() => setTab("rewards")} style={s.link}>Browse rewards and redemptions</Text></View></View>}
    {tab === "orders" && <View style={s.stack}><Button title="Refresh orders and payment status" disabled={busy} onPress={() => void refreshOrders()}/><View style={s.statusGrid}>{orderStatuses.map(status => { const selected = orderFilter === status; const count = orders.filter(order => order.status === status).length; return <Pressable key={status} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${orderFilterLabel(status, orders)} orders, ${count}`} onPress={() => setOrderFilter(status)} style={[s.statusFilter, selected && s.statusFilterSelected]}><Ionicons name={statusIcon(status)} size={18} color={selected ? "#a95400" : "#737373"}/><Text numberOfLines={1} style={[s.statusFilterLabel, selected && s.statusFilterTextSelected]}>{orderFilterLabel(status, orders)}</Text><Text style={[s.statusCount, selected && s.statusFilterTextSelected]}>{count}</Text></Pressable>})}</View>{visibleOrders.length ? visibleOrders.map(order => <View key={order.id} style={s.card}><View style={s.orderCardHeader}><View style={s.orderHeading}><View style={s.orderHeadingLine}><Text style={s.rowTitle}>{order.orderNumber}</Text><StatusBadge status={order.status} delivery={order.orderType === "delivery"}/></View><Text style={s.body}>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(order.createdAt))} · {order.orderType === "qr" ? "Dine-in" : order.orderType === "delivery" ? "Delivery" : "Pickup"}</Text>{order.delivery && <><Text style={s.body}>Deliver to: {order.delivery.address} · {order.delivery.recipientPhone} · {money(order.deliveryFee)}</Text><DeliveryTracker status={order.delivery.status}/></>}{order.pendingCancellation && <Text style={s.note}>Cancellation requested</Text>}</View><View style={s.orderTotal}><Text style={s.totalAmount}>{money(order.total)}</Text><Text style={s.paymentStatus}>{order.orderType === "delivery" && order.paymentStatus === "pending" ? "Due on delivery" : String(order.paymentStatus ?? "").replaceAll("_", " ")}{order.paymentMethod ? ` · ${order.orderType === "delivery" ? "COD" : String(order.paymentMethod).toUpperCase()}` : ""}</Text></View></View><View style={s.orderItems}>{(Array.isArray(order.items) ? order.items : []).map(item => <View key={item.id} style={s.orderItem}><View style={s.orderItemText}><Text style={s.rowTitle}>{item.quantity} × {item.name}</Text>{item.notes ? <Text style={s.body}>{item.notes}</Text> : null}</View><Text style={s.rowTitle}>{money(item.subtotal)}</Text></View>)}</View><View style={s.orderActions}>{order.paymentStatus === "pending" && order.paymentReferenceToken && <Button title="Submit payment reference" disabled={busy} onPress={() => onAction({ action: "paymentReference", token: order.paymentReferenceToken })}/ >}{order.receiptAvailable && <Button title={receiptBusy ? "Loading receipt…" : "Digital receipt"} disabled={busy || receiptBusy} onPress={() => void showReceipt(order.id)}/ >}{order.status === "pending" && !order.pendingCancellation && <><TextInput style={[s.input, s.cancelInput]} placeholder="Reason for cancellation" value={cancelReason} onChangeText={setCancelReason}/><Button title="Request cancellation" disabled={busy || cancelReason.trim().length < 3} onPress={() => { onAction({ action: "cancelOrder", orderId: order.id, reason: cancelReason }); setCancelReason("") }}/></>}{["completed", "cancelled"].includes(order.status) && <Button title="Remove from history" disabled={busy} onPress={() => onAction({ action: "removeOrder", orderId: order.id })}/>}</View></View>) : <View style={s.emptyCard}><Text style={s.rowTitle}>No {statusLabel(orderFilter).toLowerCase()} orders</Text><Text style={s.body}>Choose another status to see more order history.</Text></View>}</View>}
    {tab === "reservations" && <View style={s.stack}><Text style={s.heading}>Reservations</Text><View style={s.inline}>{(["upcoming", "history", "all"] as const).map(filter => <Pressable key={filter} onPress={() => setReservationFilter(filter)} style={[s.tab, reservationFilter === filter && s.active]}><Text style={[s.tabText, reservationFilter === filter && s.activeText]}>{filter}</Text></Pressable>)}</View><TextInput style={s.input} placeholder="Contact number" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/><TextInput style={s.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate}/><TextInput style={s.input} placeholder="Time (HH:mm)" value={time} onChangeText={setTime}/><TextInput style={s.input} placeholder="Number of guests" value={guests} onChangeText={setGuests} keyboardType="number-pad"/><TextInput style={s.input} placeholder="Notes or requests (optional)" value={notes} onChangeText={setNotes}/><Button title="Send reservation request" disabled={busy} onPress={() => onAction({ action: "reservation", contactNumber: phone, reservationDate: date, reservationTime: time, numberOfGuests: Number(guests), notes })}/>{data.reservations.filter(r => reservationFilter === "all" || (reservationFilter === "upcoming" ? upcomingReservations(r) : !upcomingReservations(r))).map(r => <View key={r.id} style={s.card}><Text style={s.rowTitle}>{r.reservationDate} · {r.reservationTime}</Text><Text style={s.body}>{r.numberOfGuests} guests · {r.status}{r.tableNumber ? ` · Table ${r.tableNumber}` : ""}</Text>{r.notes ? <Text style={s.body}>{r.notes}</Text> : null}{upcomingReservations(r) && <Button title="Cancel reservation" disabled={busy} onPress={() => onAction({ action: "cancelReservation", id: r.id })}/>}</View>)}</View>}
    {tab === "rewards" && <View style={s.stack}><View style={s.balanceCard}><Text style={s.body}>Points available</Text><Text style={s.metricValue}>{fmt(data.customer.loyaltyPointsBalance ?? 0)} <Text style={s.metricSuffix}>pts</Text></Text><Text style={s.body}>{fmt(data.earnedPoints)} points accumulated</Text></View><View style={s.card}><Text style={s.cardTitle}>Available rewards</Text>{data.rewards.length ? <ScrollView horizontal showsHorizontalScrollIndicator><View style={s.table}><View style={[s.tableRow, s.tableHeader]}><Text style={[s.tableHeadText, s.rewardCol]}>Reward</Text><Text style={[s.tableHeadText, s.pointsCol]}>Points</Text><Text style={[s.tableHeadText, s.actionCol]}>Action</Text></View>{data.rewards.map(r => { const canRedeem = (data.customer.loyaltyPointsBalance ?? 0) >= r.pointsCost; return <View key={r.id} style={s.tableRow}><View style={s.rewardCol}><Text style={s.rowTitle}>{r.name}</Text>{r.description ? <Text style={s.body}>{r.description}</Text> : null}</View><Text style={[s.tableCell, s.pointsCol]}>{fmt(r.pointsCost)} pts</Text><View style={s.actionCol}><Button title={canRedeem ? "Redeem" : "Need more points"} disabled={busy || !canRedeem} onPress={() => onAction({ action: "redeem", rewardId: r.id })}/></View></View>})}</View></ScrollView> : <Text style={s.emptyText}>No rewards are available right now.</Text>}</View><View style={s.card}><Text style={s.cardTitle}>Points activity</Text>{data.transactions.length ? <ScrollView horizontal showsHorizontalScrollIndicator><View style={s.table}><View style={[s.tableRow, s.tableHeader]}><Text style={[s.tableHeadText, s.dateCol]}>Date</Text><Text style={[s.tableHeadText, s.activityCol]}>Activity</Text><Text style={[s.tableHeadText, s.pointsCol]}>Points</Text><Text style={[s.tableHeadText, s.pointsCol]}>Balance</Text></View>{data.transactions.map(tx => <View key={tx.id} style={s.tableRow}><Text style={[s.tableCell, s.dateCol]}>{new Date(tx.createdAt).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}</Text><Text style={[s.tableCell, s.activityCol]}>{tx.type === "earn" ? "Points earned" : `Redeemed ${tx.rewardName ?? "reward"}`}</Text><Text style={[s.tableCell, s.pointsCol, tx.points > 0 ? s.positivePoints : s.negativePoints]}>{tx.points > 0 ? "+" : ""}{fmt(tx.points)}</Text><Text style={[s.tableCell, s.pointsCol]}>{fmt(tx.balanceAfter)}</Text></View>)}</View></ScrollView> : <Text style={s.emptyText}>Your points activity will appear here.</Text>}</View></View>}
    {tab === "more" && !profileEditorOpen && <View style={s.stack}><View style={s.profileCard}><View style={s.cardHeader}><Text style={s.cardTitle}>Account</Text><Pressable accessibilityRole="button" onPress={openProfileEditor} style={s.editButton}><Ionicons name="create-outline" size={16} color="#a95400"/><Text style={s.editButtonText}>Edit</Text></Pressable></View><Text style={s.profileName}>{data.customer.name}</Text><Text style={s.body}>{data.customer.email}</Text><Text style={s.body}>{data.customer.contactNumber || "Add your mobile number"}</Text><Text style={s.body}>Member since {data.customer.createdAt ? new Date(data.customer.createdAt).toLocaleDateString("en-PH") : "—"}</Text></View><View style={s.card}><Text style={s.cardTitle}>My account</Text><QuickLink title="My orders" subtitle="View order status and receipts" icon="bag-handle-outline" onPress={() => setTab("orders")}/><QuickLink title="Reservations" subtitle="Manage your table requests" icon="calendar-outline" onPress={() => setTab("reservations")}/><QuickLink title="Points & rewards" subtitle={`${fmt(data.customer.loyaltyPointsBalance ?? 0)} points available`} icon="gift-outline" onPress={() => setTab("rewards")}/></View><Button title="Sign out" disabled={busy} onPress={onSignOut}/></View>}
    </ScrollView></View>

    <Modal visible={!!receipt} animationType="slide" onRequestClose={() => setReceipt(null)}><View style={{ flex: 1, backgroundColor: "#f5f5f5", paddingTop: insets.top }}><View style={s.appHeader}><Text style={s.appHeaderTitle}>Digital receipt</Text><Pressable onPress={() => setReceipt(null)}><Text style={s.link}>Done</Text></Pressable></View>{receipt && <ScrollView contentContainerStyle={{ padding: 16 }}><View style={s.receiptPaper}><Text style={s.receiptCenter}>{receipt.settings.receiptHeader}</Text><Text style={[s.receiptCenter, s.receiptTitle]}>{receipt.settings.restaurantName}</Text>{!!receipt.settings.branchName && <Text style={s.receiptCenter}>{receipt.settings.branchName}</Text>}{!!receipt.settings.address && <Text style={s.receiptCenter}>{receipt.settings.address}</Text>}{!!receipt.settings.contactNumber && <Text style={s.receiptCenter}>{receipt.settings.contactNumber}</Text>}{!!receipt.settings.email && <Text style={s.receiptCenter}>{receipt.settings.email}</Text>}{!!receipt.settings.tinNumber && <Text style={s.receiptCenter}>TIN: {receipt.settings.tinNumber}</Text>}{!!receipt.settings.birMin && <Text style={s.receiptCenter}>MIN: {receipt.settings.birMin}</Text>}<View style={s.receiptDivider}><Text>Receipt  {receipt.receipt.receiptNumber}</Text><Text>Date  {new Date(receipt.receipt.date).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</Text><Text>Cashier  {receipt.receipt.cashier}</Text></View>{receipt.receipt.items.map((item, index) => <View key={`${item.name}-${index}`} style={s.receiptLine}><Text>{item.name}</Text><View style={s.receiptSplit}><Text>{item.quantity} × {receiptMoney(item.unitPrice, receipt.settings.currencyCode, receipt.settings.currencySymbol)}</Text><Text>{receiptMoney(item.quantity * item.unitPrice, receipt.settings.currencyCode, receipt.settings.currencySymbol)}</Text></View></View>)}<View style={s.receiptDivider}><ReceiptTotal label="Subtotal" value={receipt.receipt.totals.subtotal} format={amount => receiptMoney(amount, receipt.settings.currencyCode, receipt.settings.currencySymbol)}/>{receipt.receipt.totals.discount > 0 && <ReceiptTotal label="Discount" value={-receipt.receipt.totals.discount} format={amount => receiptMoney(amount, receipt.settings.currencyCode, receipt.settings.currencySymbol)}/ >}{receipt.settings.vatEnabled && <ReceiptTotal label={`VAT (${receipt.settings.vatRate}%)`} value={receipt.receipt.totals.tax} format={amount => receiptMoney(amount, receipt.settings.currencyCode, receipt.settings.currencySymbol)}/ >}{receipt.settings.serviceChargeEnabled && <ReceiptTotal label="Service charge" value={receipt.receipt.totals.serviceCharge} format={amount => receiptMoney(amount, receipt.settings.currencyCode, receipt.settings.currencySymbol)}/ >}{receipt.receipt.totals.deliveryFee > 0 && <ReceiptTotal label="Delivery fee" value={receipt.receipt.totals.deliveryFee} format={amount => receiptMoney(amount, receipt.settings.currencyCode, receipt.settings.currencySymbol)}/ >}<ReceiptTotal label="TOTAL" value={receipt.receipt.totals.total} bold format={amount => receiptMoney(amount, receipt.settings.currencyCode, receipt.settings.currencySymbol)}/></View><ReceiptTotal label="Payment" value={receipt.receipt.paymentMethod}/>{receipt.settings.showWifiOnReceipt && (receipt.settings.wifiSsid || receipt.settings.wifiPassword) && <View style={{ alignItems: "center" }}><Text style={{ fontWeight: "700" }}>FREE WI-FI</Text>{!!receipt.settings.wifiSsid && <Text>Network: {receipt.settings.wifiSsid}</Text>}{!!receipt.settings.wifiPassword && <Text>Password: {receipt.settings.wifiPassword}</Text>}</View>}<Text style={s.receiptCenter}>{receipt.settings.receiptFooter}</Text><Text style={[s.receiptCenter, { fontWeight: "700" }]}>Thank you for dining with us!</Text></View></ScrollView>}</View></Modal>
    <View style={[s.tabs, { paddingBottom: Math.max(insets.bottom, 8) }]}>{tabs.map(({ key, title, icon }) => { const selected = tab === key; return <Pressable key={key} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{ selected }} onPress={() => setTab(key)} style={s.bottomTab}><Ionicons name={icon} size={23} color={selected ? "#ff9900" : "#737373"} /><View style={[s.activeIndicator, selected && s.activeIndicatorOn]} /></Pressable>})}</View>
  </View>
}

function Button({ title, disabled, onPress }: { title: string; disabled: boolean; onPress: () => void }) { return <Pressable onPress={onPress} disabled={disabled} style={[s.button, disabled && { opacity: .5 }]}><Text style={s.buttonText}>{title}</Text></Pressable> }
function ReceiptTotal({ label, value, bold = false, format }: { label: string; value: number | string; bold?: boolean; format?: (amount: number) => string }) { const rendered = typeof value === "number" ? `${value < 0 ? "−" : ""}${format ? format(Math.abs(value)) : money(Math.abs(value))}` : value; return <View style={s.receiptSplit}><Text style={bold ? { fontWeight: "700" } : undefined}>{label}</Text><Text style={bold ? { fontWeight: "700" } : undefined}>{rendered}</Text></View> }
function receiptMoney(value: number, currencyCode: string, symbol: string) { try { return new Intl.NumberFormat("en-PH", { style: "currency", currency: currencyCode || "PHP" }).format(value) } catch { return `${symbol}${value.toFixed(2)}` } }
function QuickLink({ title, subtitle, icon, onPress }: { title: string; subtitle: string; icon: ComponentProps<typeof Ionicons>["name"]; onPress: () => void }) { return <Pressable onPress={onPress} style={s.quickLink}><Ionicons name={icon} size={22} color="#171717"/><View style={{ flex: 1 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.body}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={20} color="#737373"/></Pressable> }
function ProfileDeliveryAddressEditor({ label, value, isDefault, mapBusy, mapError, onChange, onPin, onCurrentLocation, onSetDefault }: { label: AddressLabel; value: DeliveryAddressDraft; isDefault: boolean; mapBusy: boolean; mapError: string; onChange: (field: keyof DeliveryAddressDraft, value: string | number | null) => void; onPin: (latitude: number, longitude: number) => void; onCurrentLocation: () => void; onSetDefault: () => void }) {
  const title = label === "home" ? "Home address" : "Work address"
  return <View style={s.addressEditor}>
    <View style={s.addressEditorHeader}><Text style={s.cardTitle}>{title}</Text><Pressable accessibilityRole="button" onPress={onSetDefault} style={[s.defaultAddressButton, isDefault && s.defaultAddressButtonActive]}><Text style={s.defaultAddressButtonText}>{isDefault ? "Default for delivery" : "Set as default"}</Text></Pressable></View>
    <TextInput style={s.input} placeholder="Recipient name" value={value.recipientName} onChangeText={text => onChange("recipientName", text)}/>
    <TextInput style={s.input} placeholder="Contact number" value={value.contactNumber} onChangeText={text => onChange("contactNumber", text)} keyboardType="phone-pad"/>
    <TextInput style={s.input} placeholder="Street, barangay, city, unit/floor" value={value.address} onChangeText={text => onChange("address", text)} multiline/>
    <Text style={s.body}>Set the delivery pin</Text>
    <DeliveryMap latitude={value.latitude} longitude={value.longitude} busy={mapBusy} onSelect={onPin} onCurrentLocation={onCurrentLocation}/>
    {!!mapError && <Text style={s.errorText}>{mapError}</Text>}
    <TextInput style={s.input} placeholder="Delivery instructions (optional)" value={value.instructions ?? ""} onChangeText={text => onChange("instructions", text)} multiline/>
    <Text style={s.body}>{value.latitude != null && value.longitude != null ? `Pinned: ${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}` : "Map pin is optional; you can add it later."}</Text>
  </View>
}
function HomeLanding({ catalog, onMenu, onOrderType }: { catalog: Catalog | null; onMenu: () => void; onOrderType: (type: "counter" | "qr" | "delivery") => void }) {
  const featured = catalog?.menu.slice(0, 5) ?? []
  const categories = catalog?.categories.slice(0, 6) ?? []
  const symbol = catalog?.currencySymbol ?? "₱"
  return <View style={s.homeLanding}>
    <View style={s.heroBanner}>
      <View style={s.heroBrand}><Image source={require("../../assets/primelogo.jpg")} resizeMode="cover" style={s.heroLogo}/></View>
      <View style={s.heroCopy}><Text style={s.heroEyebrow}>PRIME PRIME</Text><Text style={s.heroTitle}>Good food, ready when you are.</Text><Text style={s.heroSubtitle}>Explore your favorites and order in a few taps.</Text><Pressable onPress={onMenu} style={s.heroButton}><Text style={s.heroButtonText}>ORDER NOW</Text><Ionicons name="arrow-forward-circle" size={19} color="#ff9900"/></Pressable></View>
    </View>
    <View style={s.activityHeading}><Text style={s.sectionTitle}>My Activity</Text><Text style={s.sectionSubtitle}>Welcome to PRIME PRIME</Text></View>
    <View style={s.orderTypePanel}><Text style={s.orderTypeTitle}>Choose how you’ll order</Text><View style={s.orderTypeRow}>
      <Pressable onPress={() => onOrderType("counter")} style={s.orderTypeButton}><Ionicons name="bag-handle-outline" size={27} color="#ff9900"/><Text style={s.orderTypeLabel}>Pickup</Text></Pressable>
      <Pressable onPress={() => onOrderType("qr")} style={s.orderTypeButton}><Ionicons name="restaurant-outline" size={27} color="#ff9900"/><Text style={s.orderTypeLabel}>Dine-in</Text></Pressable>
      {catalog?.delivery?.enabled && <Pressable onPress={() => onOrderType("delivery")} style={s.orderTypeButton}><Ionicons name="bicycle-outline" size={27} color="#ff9900"/><Text style={s.orderTypeLabel}>Delivery</Text></Pressable>}
    </View></View>
    <View style={s.exploreHeader}><View><Text style={s.sectionTitle}>What’s on the menu?</Text><Text style={s.sectionSubtitle}>Pick a favorite to get started</Text></View><Pressable onPress={onMenu} style={s.exploreButton}><Text style={s.exploreButtonText}>Explore menu</Text><Ionicons name="arrow-forward-circle" size={19} color="#fff"/></Pressable></View>
    {categories.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryStrip}>{categories.map(category => <Pressable key={category} onPress={onMenu} style={s.categoryPill}><Text style={s.categoryPillText}>{category}</Text></Pressable>)}</ScrollView>}
    {featured.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredStrip}>{featured.map(item => <Pressable key={item.id} onPress={onMenu} style={s.featuredCard}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL}${item.imageUrl}` }} resizeMode="cover" style={s.featuredImage}/> : <View style={[s.featuredImage, s.featuredFallback]}><Ionicons name="fast-food-outline" size={32} color="#ff9900"/></View>}
      <View style={s.featuredInfo}><Text numberOfLines={1} style={s.featuredName}>{item.name}</Text><Text style={s.featuredPrice}>{symbol}{Number(item.price).toFixed(2)}</Text></View>
    </Pressable>)}</ScrollView>}
    {featured.length === 0 && <Pressable onPress={onMenu} style={s.noMenuCard}><Ionicons name="restaurant-outline" size={24} color="#ff9900"/><Text style={s.body}>Browse the menu to see what’s available today.</Text></Pressable>}
  </View>
}
function statusLabel(status: string) { const value = String(status ?? ""); return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown" }
function deliveryStageLabel(status: string) {
  switch (status) {
    case "preparing": return "Preparing"
    case "ready": return "Ready"
    case "out_for_delivery": return "Out for delivery"
    case "received": return "Order received"
    case "cancelled": return "Cancelled"
    case "failed": return "Delivery issue"
    default: return "Waiting for preparation"
  }
}
function DeliveryTracker({ status }: { status: string }) {
  const stages = [
    { id: "preparing", label: "Preparing" },
    { id: "ready", label: "Ready" },
    { id: "out_for_delivery", label: "Out for delivery" },
    { id: "received", label: "Order received" },
  ]
  const activeIndex = stages.findIndex((stage) => stage.id === status)
  if (["cancelled", "failed"].includes(status)) {
    return <View style={s.deliveryTracker}><Text style={s.deliveryTrackerTitle}>{deliveryStageLabel(status)}</Text></View>
  }
  return <View style={s.deliveryTracker}>
    <Text style={s.deliveryTrackerTitle}>{deliveryStageLabel(status)}</Text>
    {status === "pending" && <Text style={s.body}>The restaurant will begin preparing your order shortly.</Text>}
    <View style={s.deliveryTimeline}>{stages.map((stage, index) => {
      const reached = activeIndex >= index
      return <View key={stage.id} style={s.deliveryStage}>
        <Ionicons name={reached ? "checkmark-circle" : "ellipse-outline"} size={17} color={reached ? "#d97706" : "#a3a3a3"}/>
        <Text style={[s.deliveryStageLabel, reached && s.deliveryStageLabelActive]}>{stage.label}</Text>
      </View>
    })}</View>
  </View>
}
function statusIcon(status: string): ComponentProps<typeof Ionicons>["name"] {
  switch (status) {
    case "preparing": return "restaurant-outline"
    case "ready": return "notifications-outline"
    case "served": return "fast-food-outline"
    case "completed": return "checkmark-circle-outline"
    case "cancelled": return "close-circle-outline"
    default: return "time-outline"
  }
}
function StatusBadge({ status, delivery = false }: { status: string; delivery?: boolean }) { const label = delivery ? deliveryStageLabel(status === "served" ? "out_for_delivery" : status === "completed" ? "received" : status) : statusLabel(status); return <View style={[s.statusBadge, (status === "completed" || status === "received") && s.statusComplete, status === "cancelled" && s.statusCancelled, status === "ready" && s.statusReady]}><Text style={[s.statusBadgeText, (status === "completed" || status === "received") && s.statusCompleteText, status === "cancelled" && s.statusCancelledText, status === "ready" && s.statusReadyText]}>{label}</Text></View> }
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  appHeader: { minHeight: 58, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", backgroundColor: "#ff9900" },
  appHeaderTitle: { color: "#171717", fontSize: 18, fontWeight: "700" },
  appHeaderMeta: { color: "#737373", fontSize: 12, maxWidth: "48%" },
  menuScreen: { flex: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  contentScreen: { flex: 1 },
  hiddenScreen: { display: "none" },
  scroll: { flex: 1 },
  wrap: { gap: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  tabs: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingHorizontal: 4, paddingTop: 4, backgroundColor: "#fff" },
  bottomTab: { minWidth: 0, flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48, paddingVertical: 3 },
  activeIndicator: { width: 18, height: 3, borderRadius: 2, backgroundColor: "transparent", marginTop: 2 },
  activeIndicatorOn: { backgroundColor: "#ff9900" },
  tab: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  active: { backgroundColor: "rgba(255,153,0,0.10)", borderColor: "rgba(255,153,0,0.28)" },
  tabText: { fontSize: 12, color: "#525252", fontWeight: "500" },
  activeText: { color: "#a95400", fontWeight: "600" },
  stack: { gap: 14 }, inline: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  homeLanding: { gap: 16, marginHorizontal: -16, marginTop: -16 },
  heroBanner: { minHeight: 200, backgroundColor: "#ff9900", flexDirection: "row", alignItems: "center", gap: 14, padding: 18 },
  heroBrand: { width: 98, height: 112, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" },
  heroLogo: { width: "100%", height: "100%" },
  heroCopy: { flex: 1, gap: 7 },
  heroEyebrow: { color: "#525252", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  heroTitle: { color: "#171717", fontSize: 21, lineHeight: 25, fontWeight: "800" },
  heroSubtitle: { color: "#404040", fontSize: 12, lineHeight: 18 },
  heroButton: { alignSelf: "flex-start", marginTop: 3, borderRadius: 20, backgroundColor: "#ffcc00", paddingHorizontal: 13, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  heroButtonText: { color: "#a95400", fontSize: 11, fontWeight: "800" },
  activityHeading: { paddingHorizontal: 16, gap: 3, marginTop: 2 },
  sectionTitle: { color: "#171717", fontSize: 20, fontWeight: "800" },
  sectionSubtitle: { color: "#525252", fontSize: 13, fontWeight: "500" },
  orderTypePanel: { marginHorizontal: 16, padding: 15, backgroundColor: "#ff9900", borderRadius: 13, gap: 12 },
  orderTypeTitle: { color: "#171717", fontSize: 15, fontWeight: "700", textAlign: "center" },
  orderTypeRow: { flexDirection: "row", gap: 10 },
  orderTypeButton: { flex: 1, minHeight: 92, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#fff" },
  orderTypeLabel: { color: "#a95400", fontSize: 14, fontWeight: "700" },
  exploreHeader: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  exploreButton: { backgroundColor: "#ff9900", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 6 },
  exploreButtonText: { color: "#171717", fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  categoryStrip: { paddingHorizontal: 16, gap: 8 },
  categoryPill: { borderRadius: 18, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", paddingHorizontal: 13, paddingVertical: 8 },
  categoryPillText: { color: "#404040", fontSize: 12, fontWeight: "600" },
  featuredStrip: { paddingHorizontal: 16, gap: 10 },
  featuredCard: { width: 190, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  featuredImage: { width: "100%", height: 120, backgroundColor: "#f5f5f5" },
  featuredFallback: { alignItems: "center", justifyContent: "center" },
  featuredInfo: { padding: 11, gap: 4 },
  featuredName: { color: "#171717", fontSize: 14, fontWeight: "700" },
  featuredPrice: { color: "#a95400", fontSize: 13, fontWeight: "700" },
  noMenuCard: { marginHorizontal: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", gap: 8 },
  editButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#fff8ed" },
  editButtonText: { color: "#a95400", fontSize: 13, fontWeight: "600" },
  profileEditor: { backgroundColor: "#fff", padding: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, gap: 8 },
  savedAddresses: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: "#e5e7eb", gap: 12 },
  addressEditor: { padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, gap: 9 },
  addressEditorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  defaultAddressButton: { borderWidth: 1, borderColor: "#ff9900", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  defaultAddressButtonActive: { backgroundColor: "#ff9900" },
  defaultAddressButtonText: { color: "#171717", fontSize: 12, fontWeight: "700" },
  cancelButton: { alignSelf: "flex-start", minWidth: 100, alignItems: "center", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 8, backgroundColor: "#ff9900", marginTop: 6 },
  cancelButtonText: { color: "#171717", fontSize: 14, fontWeight: "700" },
  passwordInputWrap: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 46 },
  passwordEye: { position: "absolute", right: 8, height: 42, width: 36, alignItems: "center", justifyContent: "center" },
  passwordEditorSection: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderColor: "#e5e7eb", gap: 8 },
  fieldLabel: { color: "#404040", fontSize: 13, fontWeight: "600", marginTop: 4 },
  profileCard: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 16, gap: 5 },
  profileName: { color: "#171717", fontSize: 20, fontWeight: "700", marginTop: 4 },
  success: { color: "#15803d", fontSize: 13 },
  errorText: { color: "#a95400", fontSize: 13 },
  quickLink: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 13, borderBottomWidth: 1, borderColor: "#f1f1f1", paddingVertical: 9 },
  pageHeader: { gap: 7, marginBottom: 4 }, eyebrow: { color: "#d97706", fontSize: 12, fontWeight: "600" },
  heading: { color: "#171717", fontSize: 24, lineHeight: 30, fontWeight: "600" },
  cardTitle: { color: "#171717", fontSize: 16, fontWeight: "600" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 10, marginBottom: 2 },
  rowTitle: { color: "#171717", fontWeight: "600", fontSize: 14 },
  body: { color: "#737373", fontSize: 13, lineHeight: 20 },
  note: { color: "#b45309", fontSize: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, color: "#171717", fontSize: 14 },
  button: { backgroundColor: "#ff9900", borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#171717", fontWeight: "600", fontSize: 14 },
  message: { color: "#15803d", fontSize: 13 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { flexBasis: "47%", flexGrow: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 15 },
  metricValue: { color: "#171717", fontWeight: "600", fontSize: 26, marginTop: 8 },
  metricSuffix: { color: "#737373", fontWeight: "400", fontSize: 14 },
  orderRow: { minHeight: 54, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, borderBottomWidth: 1, borderColor: "#f1f1f1", paddingVertical: 9 },
  badge: { color: "#525252", borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: "hidden", fontSize: 11 },
  balance: { backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12 },
  balanceCard: { backgroundColor: "#fff8ed", borderWidth: 1, borderColor: "#ffe0ad", borderRadius: 12, padding: 16, gap: 3 },
  table: { minWidth: 560, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 9, overflow: "hidden" },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 58, borderBottomWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 12, gap: 8 },
  tableHeader: { minHeight: 38, backgroundColor: "#f7f7f7" },
  tableHeadText: { color: "#737373", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  tableCell: { color: "#171717", fontSize: 13 },
  rewardCol: { width: 230 },
  pointsCol: { width: 95 },
  actionCol: { width: 150 },
  dateCol: { width: 105 },
  activityCol: { width: 200 },
  positivePoints: { color: "#15803d", fontWeight: "700" },
  negativePoints: { color: "#a95400", fontWeight: "700" },
  emptyText: { color: "#737373", fontSize: 13, paddingVertical: 12 },
  emptyCard: { alignItems: "center", gap: 5, padding: 22, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#fff" },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusFilter: { width: "15.8%", minWidth: 50, flexGrow: 1, minHeight: 54, justifyContent: "center", alignItems: "center", gap: 2, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 9, backgroundColor: "#fff", paddingHorizontal: 3, paddingVertical: 4 },
  statusFilterSelected: { borderColor: "rgba(255,153,0,.55)", backgroundColor: "#fff8ed" },
  statusFilterLabel: { color: "#737373", fontSize: 9, fontWeight: "600" },
  statusFilterTextSelected: { color: "#a95400" },
  statusCount: { color: "#171717", fontSize: 14, fontWeight: "700" },
  orderCardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 11 },
  orderHeading: { flex: 1, gap: 5 },
  orderHeadingLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  orderTotal: { alignItems: "flex-end", maxWidth: "40%", gap: 2 },
  totalAmount: { color: "#171717", fontSize: 16, fontWeight: "700" },
  paymentStatus: { color: "#737373", fontSize: 10, textTransform: "capitalize", textAlign: "right" },
  statusBadge: { borderRadius: 12, borderWidth: 1, borderColor: "#d4d4d4", backgroundColor: "#f7f7f7", paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { color: "#525252", fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  statusComplete: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  statusCompleteText: { color: "#15803d" },
  statusCancelled: { borderColor: "#ffe0ad", backgroundColor: "#fff8ed" },
  statusCancelledText: { color: "#a95400" },
  statusReady: { borderColor: "#fde68a", backgroundColor: "#fffbeb" },
  statusReadyText: { color: "#a16207" },
  orderItems: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10 },
  orderItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderColor: "#f1f1f1" },
  orderItemText: { flex: 1, gap: 2 },
  orderActions: { gap: 5 },
  deliveryTracker: { borderWidth: 1, borderColor: "#fed7aa", backgroundColor: "#fffaf3", borderRadius: 9, padding: 11, gap: 8 },
  deliveryTrackerTitle: { color: "#92400e", fontSize: 13, fontWeight: "700" },
  deliveryTimeline: { flexDirection: "row", justifyContent: "space-between", gap: 2 },
  deliveryStage: { flex: 1, alignItems: "center", gap: 4 },
  deliveryStageLabel: { color: "#737373", fontSize: 9, lineHeight: 12, textAlign: "center" },
  deliveryStageLabelActive: { color: "#92400e", fontWeight: "700" },
  cancelInput: { marginTop: 5 },
  link: { color: "#171717", fontSize: 13, fontWeight: "500", textDecorationLine: "underline" },
  receiptPaper: { backgroundColor: "#fff", padding: 22, gap: 8, borderRadius: 8 }, receiptCenter: { textAlign: "center", color: "#171717", fontSize: 12 }, receiptTitle: { fontSize: 17, fontWeight: "700", textTransform: "uppercase" }, receiptDivider: { borderTopWidth: 1, borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#a3a3a3", paddingVertical: 10, marginVertical: 6, gap: 4 }, receiptLine: { gap: 2, marginVertical: 3 }, receiptSplit: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
})
