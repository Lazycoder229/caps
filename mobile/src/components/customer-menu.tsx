import { useCallback, useEffect, useMemo, useState } from "react"
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { API_URL, type Catalog, type SavedDeliveryAddress } from "../lib/api"
import { deduplicateAddressParts, normalizeAddressText } from "../lib/address"
import * as Location from "expo-location"
import DeliveryMap from "./delivery-map"
import { Text, TextInput } from "./app-typography"

type Line = { menuItemId: string; quantity: number; notes: string }
type OrderPayload = Record<string, unknown>
type Props = {
  catalog: Catalog | null
  busy: boolean
  isAuthenticated: boolean
  tableId?: string | null
  initialOrderType?: "counter" | "qr" | "delivery"
  customerName?: string
  customerPhone?: string
  deliveryAddresses?: SavedDeliveryAddress[]
  defaultDeliveryAddress?: "home" | "work" | null
  orderIntentKey?: number
  cartPageVisible?: boolean
  checkoutPageVisible?: boolean
  onOpenCartPage?: () => void
  onOpenCheckout?: () => void
  onBackToMenu?: () => void
  onBackToCart?: () => void
  onOrderSuccess?: () => void
  onOrder: (payload: OrderPayload) => Promise<string | null>
}
const money = (value: number, symbol: string) => `${symbol}${value.toFixed(2)}`
const EMPTY_MENU: NonNullable<Catalog["menu"]> = []
const EMPTY_DELIVERY_ADDRESSES: SavedDeliveryAddress[] = []

export function CustomerMenu({ catalog, busy, isAuthenticated, tableId, initialOrderType, customerName = "", customerPhone = "", deliveryAddresses = EMPTY_DELIVERY_ADDRESSES, defaultDeliveryAddress = null, orderIntentKey = 0, cartPageVisible: controlledCartPage, checkoutPageVisible: controlledCheckoutPage, onOpenCartPage, onOpenCheckout, onBackToMenu, onBackToCart, onOrderSuccess, onOrder }: Props) {
  const [cart, setCart] = useState<Line[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [searchOpen, setSearchOpen] = useState(false)
  const [orderTypeState, setOrderTypeState] = useState<{ key: number; value: "counter" | "qr" | "delivery" }>({ key: orderIntentKey, value: tableId ? "qr" : initialOrderType ?? "counter" })
  const orderType = orderTypeState.key === orderIntentKey ? orderTypeState.value : initialOrderType ?? "counter"
  const [selectedTable, setSelectedTable] = useState<string | null>(tableId ?? null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [promotionId, setPromotionId] = useState<string | null>(null)
  const [discountTypeId, setDiscountTypeId] = useState<string | null>(null)
  const [discountHolderName, setDiscountHolderName] = useState("")
  const [discountIdNumber, setDiscountIdNumber] = useState("")
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [deliveryRecipientName, setDeliveryRecipientName] = useState(customerName)
  const [deliveryContactNumber, setDeliveryContactNumber] = useState(customerPhone || guestPhone)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<"home" | "work" | null>(null)
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null)
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null)
  const [mapBusy, setMapBusy] = useState(false)
  const [mapError, setMapError] = useState("")
  const [message, setMessage] = useState("")
  const [orderDone, setOrderDone] = useState("")
  const [standaloneCartPage, setStandaloneCartPage] = useState(false)
  const [standaloneCheckoutPage, setStandaloneCheckoutPage] = useState(false)
  const cartPageVisible = controlledCartPage ?? standaloneCartPage
  const checkoutPageVisible = controlledCheckoutPage ?? standaloneCheckoutPage
  const menu = catalog?.menu ?? EMPTY_MENU
  const availableTables = useMemo(() => {
    const seen = new Set<string>()
    return (catalog?.tables ?? []).filter(table => {
      if (table.status !== "available") return false
      const number = table.tableNumber.trim().toLocaleLowerCase()
      if (seen.has(number)) return false
      seen.add(number)
      return true
    })
  }, [catalog?.tables])
  const visibleMenu = useMemo(() => {
    const term = search.trim().toLowerCase()
    return menu.filter(item => (category === "All" || item.category === category) && (!term || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(term)))
  }, [menu, search, category])
  const qty = (id: string) => cart.find(line => line.menuItemId === id)?.quantity ?? 0
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const subtotal = cart.reduce((sum, line) => sum + (menu.find(item => item.id === line.menuItemId)?.price ?? 0) * line.quantity, 0)
  const promotion = catalog?.promotions?.find(item => item.id === promotionId)
  const discount = catalog?.discounts?.find(item => item.id === discountTypeId)
  const discountAmount = discount ? Math.min(subtotal, Math.round(subtotal * discount.percentage) / 100) : 0
  const eligible = promotion?.menuItemIds.length ? cart.filter(line => promotion.menuItemIds.includes(line.menuItemId)).reduce((sum, line) => sum + (menu.find(item => item.id === line.menuItemId)?.price ?? 0) * line.quantity, 0) : subtotal
  const promoBase = Math.max(0, eligible - discountAmount)
  const promoAmount = promotion ? Math.min(promoBase, promotion.promoType === "percentage" ? promoBase * promotion.discountValue / 100 : promotion.discountValue) : 0
  const taxable = Math.max(0, subtotal - discountAmount - promoAmount)
  const pricing = catalog?.pricing
  const tax = pricing?.vatEnabled ? taxable * (pricing.vatInclusive ? pricing.vatRate / (100 + pricing.vatRate) : pricing.vatRate / 100) : 0
  const service = pricing?.serviceChargeEnabled ? taxable * pricing.serviceChargeRate / 100 : 0
  const deliveryFee = orderType === "delivery" ? Number(catalog?.delivery?.fee ?? 0) : 0
  const total = taxable + service + (pricing?.vatEnabled && !pricing.vatInclusive ? tax : 0) + deliveryFee
  const symbol = catalog?.currencySymbol ?? "₱"
  const availablePaymentMethods = catalog?.paymentMethods ?? []
  const selectedPaymentMethod = orderType === "delivery"
    ? "cash"
    : availablePaymentMethods.some(item => item.id === paymentMethod)
      ? paymentMethod
      : availablePaymentMethods[0]?.id ?? ""
  const selectedPayment = availablePaymentMethods.find(item => item.id === selectedPaymentMethod)

  const applySavedDeliveryAddress = useCallback((address: SavedDeliveryAddress) => {
    setSelectedDeliveryAddress(address.label)
    setDeliveryRecipientName(address.recipientName)
    setDeliveryContactNumber(address.contactNumber)
    setDeliveryAddress(normalizeAddressText(address.address))
    setDeliveryInstructions(address.instructions ?? "")
    setDeliveryLatitude(address.latitude)
    setDeliveryLongitude(address.longitude)
  }, [])

  useEffect(() => {
    if (orderType !== "delivery") return
    const timer = setTimeout(() => {
      const preferred = deliveryAddresses.find(address => address.label === defaultDeliveryAddress)
        ?? deliveryAddresses.find(address => address.label === "home")
        ?? deliveryAddresses.find(address => address.label === "work")
      if (preferred) applySavedDeliveryAddress(preferred)
      else {
        setSelectedDeliveryAddress(null)
        setDeliveryRecipientName(customerName)
        setDeliveryContactNumber(customerPhone)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [orderType, orderIntentKey, deliveryAddresses, defaultDeliveryAddress, customerName, customerPhone, applySavedDeliveryAddress])

  const setOrderType = (value: "counter" | "qr" | "delivery") => setOrderTypeState({ key: orderIntentKey, value })
  async function selectDeliveryLocation(latitude: number, longitude: number) {
    setDeliveryLatitude(latitude)
    setDeliveryLongitude(longitude)
    setMapError("")
    if (Platform.OS === "web") {
      setMapError("Pin saved. Enter the street and barangay manually; automatic address lookup is not configured for web yet.")
      return
    }
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude })
      const place = places[0]
      if (place) setDeliveryAddress(deduplicateAddressParts([place.name, place.street, place.district, place.city, place.region]).join(", "))
    } catch { /* Keep the pin coordinates; the customer can enter the address manually. */ }
  }
  async function getCurrentLocation() {
    setMapBusy(true)
    setMapError("")
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) { setMapError("Allow location access to use your current location, or tap the map to set a pin."); return }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
      await selectDeliveryLocation(location.coords.latitude, location.coords.longitude)
      if (location.coords.accuracy != null && location.coords.accuracy > 1000) {
        setMapError(`Your device's location is approximate (±${(location.coords.accuracy / 1000).toFixed(1)} km). Move the pin manually for a more accurate address.`)
      }
    } catch { setMapError("Could not get your current location. Tap the map to set a pin.") }
    finally { setMapBusy(false) }
  }
  const openCartPage = () => onOpenCartPage ? onOpenCartPage() : setStandaloneCartPage(true)
  const backToMenu = () => onBackToMenu ? onBackToMenu() : setStandaloneCartPage(false)
  const openCheckout = () => onOpenCheckout ? onOpenCheckout() : setStandaloneCheckoutPage(true)
  const backToCart = () => onBackToCart ? onBackToCart() : setStandaloneCheckoutPage(false)

  function setQuantity(id: string, delta: number) {
    setCart(current => {
      const existing = current.find(line => line.menuItemId === id)
      if (!existing && delta > 0) return [...current, { menuItemId: id, quantity: 1, notes: "" }]
      return current.map(line => line.menuItemId === id ? { ...line, quantity: Math.max(0, Math.min(99, line.quantity + delta)) } : line).filter(line => line.quantity > 0)
    })
  }

  async function placeOrder() {
    setMessage("")
    if (!cart.length) return setMessage("Add at least one menu item.")
    if (!isAuthenticated && orderType !== "delivery" && guestName.trim().length < 2) return setMessage("Enter your name to place a guest order.")
    if (!selectedPaymentMethod) return setMessage("No payment methods are available. Please contact the restaurant.")
    if (orderType === "qr" && pricing?.requireTableSelection && !selectedTable) return setMessage("Choose a table for dine-in.")
    if (orderType === "delivery") {
      if (!catalog?.delivery?.enabled) return setMessage("Delivery is not available right now. Choose pickup instead.")
      if (subtotal < Number(catalog.delivery.minimumOrder ?? 0)) return setMessage(`Delivery requires a minimum order of ${money(Number(catalog.delivery.minimumOrder), symbol)}.`)
      if (deliveryRecipientName.trim().length < 2) return setMessage("Enter the recipient's name for delivery.")
      if (deliveryContactNumber.trim().length < 7) return setMessage("Enter a valid contact number for delivery.")
      if (deliveryAddress.trim().length < 8) return setMessage("Enter your complete delivery address.")
      if (deliveryLatitude == null || deliveryLongitude == null) return setMessage("Select your delivery location on the map.")
    }
    const error = await onOrder({
      action: "placeOrder",
      order: {
        orderType,
        tableId: orderType === "qr" ? selectedTable : null,
        guestName: isAuthenticated ? null : orderType === "delivery" ? deliveryRecipientName.trim() : guestName.trim(),
        guestContactNumber: isAuthenticated ? null : orderType === "delivery" ? deliveryContactNumber.trim() || null : guestPhone.trim() || null,
        deliveryRecipientName: orderType === "delivery" ? deliveryRecipientName.trim() : null,
        deliveryContactNumber: orderType === "delivery" ? deliveryContactNumber.trim() : null,
        deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : null,
        deliveryLatitude: orderType === "delivery" ? deliveryLatitude : null,
        deliveryLongitude: orderType === "delivery" ? deliveryLongitude : null,
        deliveryInstructions: orderType === "delivery" ? deliveryInstructions.trim() || null : null,
        paymentMethod: orderType === "delivery" ? "cash" : selectedPaymentMethod,
        promotionId,
        discountTypeId,
        discountHolderName: discountHolderName.trim() || null,
        discountIdNumber: discountIdNumber.trim() || null,
        lines: cart.map(line => ({ ...line, notes: line.notes || null })),
      },
    })
    if (error) { setMessage(error); return }
    setOrderDone(orderType === "delivery"
      ? "Your delivery order was received. Pay cash when your order arrives. The restaurant can continue preparing and delivering your order."
      : "Your order was received. Payment is pending verification.")
    setCart([])
  }

  return <View style={s.page}>
    <ScrollView style={[s.menuScroll, (cartPageVisible || checkoutPageVisible) && s.hidden]} contentContainerStyle={s.menuContent} keyboardShouldPersistTaps="handled">
    <View style={s.searchBar}>{searchOpen ? <TextInput autoFocus accessibilityLabel="Search menu" value={search} onChangeText={setSearch} placeholder="Search menu" placeholderTextColor="#737373" style={s.searchInput} /> : <View style={{ flex: 1 }} />}<Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? "Close search" : "Search menu"} style={s.searchButton} onPress={() => { setSearchOpen(value => !value); if (searchOpen) setSearch("") }}><Text style={s.searchIcon}>{searchOpen ? "×" : "⌕"}</Text></Pressable></View>
    {!isAuthenticated && <Text style={s.guestNote}>Guest checkout is available. Sign in to save order history and points.</Text>}
    <View style={s.categoryHeading}><Text style={s.categoryTitle}>{category === "All" ? "Menu" : category}</Text><Text style={s.categoryCount}>{visibleMenu.length} ITEMS</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{(catalog?.categories ?? ["All"]).map(item => <Pressable key={item} onPress={() => setCategory(item)} style={[s.category, category === item && s.categorySelected]}><Text style={[s.categoryText, category === item && s.categoryTextSelected]}>{item}</Text></Pressable>)}</ScrollView>
    {visibleMenu.length ? <View style={s.menuGrid}>{visibleMenu.map(item => <View key={item.id} style={s.menuCard}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${API_URL}${item.imageUrl}` }} resizeMode="cover" style={s.foodImage} /> : <View style={[s.foodImage, s.imageFallback]}><Text style={s.foodPlaceholder}>▰</Text><Text style={s.placeholderCaption}>FOOD & DRINKS</Text></View>}
      <View style={s.menuBody}><Text numberOfLines={2} style={s.menuName}>{item.name}</Text>{item.description ? <Text numberOfLines={2} style={s.muted}>{item.description}</Text> : null}<View style={s.menuFooter}><View><Text style={s.price}>{money(item.price, symbol)}</Text>{qty(item.id) > 0 && <Text style={s.qty}>{qty(item.id)} in cart</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel={`Add ${item.name} to cart`} onPress={() => setQuantity(item.id, 1)} style={s.addButton}><Text style={s.addButtonText}>{qty(item.id) ? "+ Add" : "Add +"}</Text></Pressable></View></View>
    </View>)}</View> : <Text style={s.muted}>No available menu items match your search.</Text>}
    </ScrollView>
    {!cartPageVisible && !checkoutPageVisible && itemCount > 0 && <Pressable onPress={openCartPage} style={s.viewCart}><Text style={s.viewCartText}>♧  View cart  <Text style={s.cartBadge}>{itemCount}</Text></Text><Text style={s.viewCartText}>{money(total, symbol)}  →</Text></Pressable>}
    {(cartPageVisible || checkoutPageVisible) && <View style={s.cartPage}>
      <View style={s.cartPageHeader}><View><Text style={s.sheetTitle}>{checkoutPageVisible ? "Review your order" : "Your cart"}</Text><Text style={s.muted}>{itemCount} item{itemCount === 1 ? "" : "s"}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={checkoutPageVisible ? "Back to cart" : "Continue shopping"} onPress={checkoutPageVisible ? backToCart : backToMenu} style={s.continueButton}><Text style={s.continueText}>{checkoutPageVisible ? "‹  Cart" : "‹  Menu"}</Text></Pressable></View>
      {cart.length ? <>
        <ScrollView style={s.sheetScroll} contentContainerStyle={[s.sheetContent, s.sheetContentWithFooter]} keyboardShouldPersistTaps="handled">
          {cart.map(line => { const item = menu.find(entry => entry.id === line.menuItemId); if (!item) return null; return <View key={line.menuItemId} style={s.cartLine}><View style={s.cartRow}><View style={{ flex: 1 }}><Text style={s.cartName}>{line.quantity} × {item.name}</Text><Text style={s.muted}>{money(item.price * line.quantity, symbol)}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} onPress={() => setQuantity(item.id, -line.quantity)}><Text style={s.close}>×</Text></Pressable></View><TextInput value={line.notes} onChangeText={value => setCart(current => current.map(entry => entry.menuItemId === line.menuItemId ? { ...entry, notes: value } : entry))} maxLength={255} placeholder="Special request (optional)" style={s.notes} /></View> })}
          {checkoutPageVisible && <>
          {!isAuthenticated && orderType !== "delivery" && <View style={s.fieldset}><Text style={s.label}>GUEST CHECKOUT</Text><TextInput value={guestName} onChangeText={setGuestName} placeholder="Name for your order" style={s.input} /><TextInput value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" placeholder="Mobile number (optional)" style={s.input} /><Text style={s.muted}>No account needed. Sign in only if you want to save order history and points.</Text></View>}
          {tableId ? <View style={s.tableNotice}><Text style={s.label}>DINE-IN · TABLE SELECTED</Text><Text style={s.muted}>Table selected from the scanned QR code.</Text></View> : <View><Text style={s.label}>ORDER TYPE</Text><View style={s.options}><Choice label="Pickup" selected={orderType === "counter"} onPress={() => { setOrderType("counter"); setSelectedTable(null) }} /><Choice label="Dine-in" selected={orderType === "qr"} onPress={() => setOrderType("qr")} />{catalog?.delivery?.enabled && <Choice label="Delivery" selected={orderType === "delivery"} onPress={() => { setOrderType("delivery"); setSelectedTable(null); setDeliveryRecipientName(value => value || guestName); setDeliveryContactNumber(value => value || guestPhone) }} />}</View></View>}
          {orderType === "qr" && !tableId && <View><Text style={s.label}>TABLE</Text><View style={s.options}>{availableTables.map(table => <Choice key={table.id} label={`Table ${table.tableNumber}`} selected={table.id === selectedTable} onPress={() => setSelectedTable(table.id)} />)}</View></View>}
          {orderType === "delivery" && <View><Text style={s.label}>DELIVERY DETAILS</Text>{deliveryAddresses.length > 0 && <View><Text style={s.muted}>Choose a saved address</Text><View style={s.options}>{deliveryAddresses.map(address => <Choice key={address.label} label={address.label === "home" ? "Home" : "Work"} selected={selectedDeliveryAddress === address.label} onPress={() => applySavedDeliveryAddress(address)} />)}</View></View>}<TextInput value={deliveryRecipientName} onChangeText={value => { setDeliveryRecipientName(value); setSelectedDeliveryAddress(null) }} placeholder="Recipient name" style={s.input}/><TextInput value={deliveryContactNumber} onChangeText={value => { setDeliveryContactNumber(value); setSelectedDeliveryAddress(null) }} keyboardType="phone-pad" placeholder="Contact number" style={s.input}/><Text style={s.muted}>Tap the map to set your delivery pin. Flat delivery fee: {money(Number(catalog?.delivery?.fee ?? 0), symbol)}{Number(catalog?.delivery?.minimumOrder ?? 0) > 0 ? ` · Minimum order ${money(Number(catalog?.delivery?.minimumOrder), symbol)}` : ""}</Text><DeliveryMap latitude={deliveryLatitude} longitude={deliveryLongitude} busy={mapBusy} onSelect={selectDeliveryLocation} onCurrentLocation={() => void getCurrentLocation()} />{!!mapError && <Text style={s.error}>{mapError}</Text>}<TextInput value={deliveryAddress} onChangeText={value => { setDeliveryAddress(value); setSelectedDeliveryAddress(null) }} placeholder="Street, barangay, city, unit/floor" style={s.input} multiline/><TextInput value={deliveryInstructions} onChangeText={value => { setDeliveryInstructions(value); setSelectedDeliveryAddress(null) }} placeholder="Delivery instructions (optional)" style={s.input} multiline/><Text style={s.muted}>{deliveryLatitude != null && deliveryLongitude != null ? `Pinned: ${deliveryLatitude.toFixed(6)}, ${deliveryLongitude.toFixed(6)}` : "No map pin selected yet."}</Text></View>}
          {!!catalog?.promotions?.length && <View><Text style={s.label}>PROMOTION</Text><View style={s.options}><Choice label="No promotion" selected={!promotionId} onPress={() => setPromotionId(null)} />{catalog.promotions.map(item => <Choice key={item.id} label={item.name} selected={promotionId === item.id} onPress={() => setPromotionId(item.id)} />)}</View></View>}
          {!!catalog?.discounts?.length && <View><Text style={s.label}>DISCOUNT</Text><View style={s.options}><Choice label="No discount" selected={!discountTypeId} onPress={() => { setDiscountTypeId(null); setDiscountHolderName(""); setDiscountIdNumber("") }} />{catalog.discounts.map(item => <Choice key={item.id} label={`${item.name} · ${item.percentage}%`} selected={discountTypeId === item.id} onPress={() => setDiscountTypeId(item.id)} />)}</View></View>}
          {discountTypeId && <><TextInput value={discountHolderName} onChangeText={setDiscountHolderName} placeholder="Discount holder name" style={s.input} />{discount?.requiresIdVerification && <TextInput value={discountIdNumber} onChangeText={setDiscountIdNumber} placeholder="Discount ID number" style={s.input} />}<Text style={s.muted}>Staff will verify the discount and ID before confirming payment.</Text></>}
          {orderType === "delivery" ? <View><Text style={s.label}>PAYMENT METHOD</Text><View style={s.tableNotice}><Text style={s.choiceTextSelected}>Cash on delivery</Text><Text style={s.muted}>Pay the rider in cash when your order arrives.</Text></View></View> : <View><Text style={s.label}>PAYMENT METHOD</Text><View style={s.options}>{availablePaymentMethods.map(item => <Choice key={item.id} label={item.label} selected={selectedPaymentMethod === item.id} onPress={() => setPaymentMethod(item.id)} />)}</View></View>}
          {selectedPayment?.qrImage && <View style={s.qrPayment}><Text style={s.label}>Scan to pay using {selectedPayment.label}</Text><Image source={{ uri: selectedPayment.qrImage }} resizeMode="contain" style={s.paymentQr} /></View>}
          </>}
        </ScrollView>
        <View style={s.sheetFooter}><Summary label="Subtotal" amount={subtotal} symbol={symbol} />{checkoutPageVisible && discountAmount > 0 && <Summary label={discount?.name ?? "Discount"} amount={-discountAmount} symbol={symbol} />}{checkoutPageVisible && promoAmount > 0 && <Summary label="Promotion" amount={-promoAmount} symbol={symbol} />}{pricing?.vatEnabled && <Summary label={`VAT ${pricing.vatInclusive ? "(included)" : ""}`} amount={tax} symbol={symbol} />}{pricing?.serviceChargeEnabled && <Summary label="Service charge" amount={service} symbol={symbol} />}{checkoutPageVisible && deliveryFee > 0 && <Summary label="Delivery fee" amount={deliveryFee} symbol={symbol} />}<View style={s.totalRow}><Text style={s.totalText}>Total</Text><Text style={s.totalText}>{money(total, symbol)}</Text></View>{checkoutPageVisible && !!message && <Text style={s.error}>{message}</Text>}{checkoutPageVisible ? <><Pressable disabled={busy || !cart.length || !selectedPaymentMethod} onPress={() => void placeOrder()} style={[s.submit, (busy || !cart.length || !selectedPaymentMethod) && s.disabled]}><Text style={s.submitText}>{busy ? "Placing order…" : isAuthenticated ? "Place order" : "Place guest order"}</Text></Pressable><Text style={s.footerNote}>{orderType === "delivery" ? "Your order can be prepared while payment remains due on delivery." : "Orders stay pending until staff confirms payment."}</Text></> : <Pressable disabled={!cart.length} onPress={openCheckout} style={[s.submit, !cart.length && s.disabled]}><Text style={s.submitText}>Continue to checkout</Text></Pressable>}</View>
      </> : <View style={s.emptyCart}><Text style={s.emptyCartTitle}>Your cart is empty</Text><Text style={s.muted}>Browse the menu and add something you love.</Text><Pressable style={s.submit} onPress={backToMenu}><Text style={s.submitText}>Browse menu</Text></Pressable></View>}
    </View>}
    <Modal visible={!!orderDone} transparent animationType="fade" onRequestClose={() => setOrderDone("")}><View style={s.confirmOverlay}><View style={s.confirmCard}><Text style={s.sheetTitle}>Order received</Text><Text style={s.muted}>{orderDone}</Text>{isAuthenticated && orderType === "delivery" && <Pressable style={s.submit} onPress={() => { setOrderDone(""); onOrderSuccess?.() }}><Text style={s.submitText}>Track delivery</Text></Pressable>}<Pressable style={s.submit} onPress={() => setOrderDone("")}><Text style={s.submitText}>Done</Text></Pressable></View></View></Modal>
  </View>
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[s.choice, selected && s.choiceSelected]}><Text style={[s.choiceText, selected && s.choiceTextSelected]}>{label}</Text></Pressable> }
function Summary({ label, amount, symbol }: { label: string; amount: number; symbol: string }) { return <View style={s.summary}><Text style={s.muted}>{label}</Text><Text style={s.muted}>{amount < 0 ? "−" : ""}{money(Math.abs(amount), symbol)}</Text></View> }

const s = StyleSheet.create({
  page: { flex: 1, minHeight: 0, position: "relative" }, menuScroll: { flex: 1 }, hidden: { display: "none" }, menuContent: { gap: 0, paddingBottom: 104 }, muted: { color: "#737373", fontSize: 13, lineHeight: 20 }, guestNote: { color: "#737373", fontSize: 12, paddingVertical: 10 },
  menuTopBar: { minHeight: 68, marginTop: -12, marginHorizontal: -12, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", backgroundColor: "#ff9900", gap: 20 }, backIconText: { color: "#fff", fontSize: 38, lineHeight: 42 }, menuTopTitle: { color: "#171717", fontSize: 22, fontWeight: "600", flex: 1 }, menuTopActions: { flexDirection: "row", alignItems: "center", gap: 12 }, offersPill: { backgroundColor: "#fff", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 }, offersText: { color: "#a95400", fontWeight: "700", fontSize: 13 }, bell: { width: 42, height: 42, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 24 }, bellText: { fontSize: 19, color: "#a95400" }, deliveryBar: { minHeight: 66, marginHorizontal: -12, paddingHorizontal: 20, backgroundColor: "#ff9900", borderTopWidth: 1, borderColor: "rgba(255,255,255,.18)", flexDirection: "row", alignItems: "center", gap: 12 }, deliveryLabel: { color: "#171717", fontSize: 14, fontWeight: "600" }, deliveryAddress: { color: "#404040", fontSize: 13, marginTop: 4 }, changeText: { color: "#171717", fontSize: 14, textDecorationLine: "underline" }, searchBar: { minHeight: 62, marginHorizontal: -12, paddingHorizontal: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#e5e7eb", flexDirection: "row", alignItems: "center" }, searchInput: { flex: 1, height: 48, paddingVertical: 0, fontSize: 16, color: "#171717", textAlignVertical: "center" }, searchButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" }, searchIcon: { fontSize: 30, lineHeight: 36, color: "#171717", textAlign: "center" }, categoryHeading: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2, borderBottomWidth: 1, borderColor: "#e5e7eb" }, categoryTitle: { color: "#a95400", fontSize: 22, lineHeight: 28, fontWeight: "800" }, categoryCount: { color: "#a95400", fontSize: 12, marginTop: 2 }, categories: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 12 }, category: { minHeight: 36, justifyContent: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, backgroundColor: "#fff" }, categorySelected: { borderColor: "#ff9900", backgroundColor: "#ff9900" }, categoryText: { color: "#171717", fontSize: 13 }, categoryTextSelected: { color: "#171717", fontWeight: "700" },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 24, paddingHorizontal: 14, paddingTop: 24 }, menuCard: { width: "48%", overflow: "hidden", backgroundColor: "#fff" }, foodImage: { width: "100%", aspectRatio: 1.25, borderRadius: 12, backgroundColor: "#f0f0f0" }, imageFallback: { justifyContent: "center", alignItems: "center" }, foodPlaceholder: { color: "#737373", fontSize: 56, fontWeight: "700" }, placeholderCaption: { color: "#737373", fontSize: 9, letterSpacing: 1 }, menuBody: { minHeight: 166, paddingTop: 13, paddingBottom: 6, gap: 5, justifyContent: "space-between" }, menuName: { color: "#a95400", fontSize: 16, lineHeight: 20, fontWeight: "700", minHeight: 40 }, menuFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5, marginTop: 10 }, price: { color: "#171717", fontSize: 16, fontWeight: "700" }, addButton: { minWidth: 88, minHeight: 42, alignItems: "center", justifyContent: "center", backgroundColor: "#ff9900", borderRadius: 9, paddingHorizontal: 8 }, addButtonText: { color: "#171717", fontSize: 14, fontWeight: "700" }, customizable: { color: "#ff9900", textAlign: "center", fontWeight: "700", fontSize: 12 }, qty: { color: "#737373", fontSize: 11, marginTop: 2 },
  categoriesFab: { position: "absolute", right: 16, bottom: 18, zIndex: 2, backgroundColor: "#ff9900", borderRadius: 28, paddingHorizontal: 20, paddingVertical: 12, elevation: 5 }, categoriesFabRaised: { bottom: 70 }, categoriesFabText: { color: "#fff", fontSize: 16, fontWeight: "700" }, categoryOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,.45)" }, categorySheet: { maxHeight: "70%", backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, gap: 8 }, categorySheetTitle: { color: "#171717", fontSize: 20, fontWeight: "700", paddingBottom: 8 }, categoryOption: { minHeight: 48, borderBottomWidth: 1, borderColor: "#eee", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8 }, categoryOptionActive: { backgroundColor: "#fff8ed" }, categoryOptionText: { color: "#171717", fontSize: 16 }, categoryOptionTextActive: { color: "#ff9900", fontWeight: "700" },
  viewCart: { position: "absolute", left: 12, right: 12, bottom: 8, minHeight: 52, borderRadius: 28, backgroundColor: "#171717", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, zIndex: 2 }, viewCartText: { color: "#fff", fontWeight: "700", fontSize: 14 }, cartBadge: { color: "#fff", backgroundColor: "#454545", overflow: "hidden", borderRadius: 12, paddingHorizontal: 8 },
  cartPage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#fff", zIndex: 3 }, cartPageHeader: { minHeight: 66, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#e5e7eb" }, continueButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 10 }, continueText: { color: "#ff9900", fontSize: 14, fontWeight: "700" }, emptyCart: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 }, emptyCartTitle: { color: "#171717", fontSize: 20, fontWeight: "700" }, sheetTitle: { color: "#171717", fontSize: 19, fontWeight: "700" }, close: { color: "#171717", fontSize: 28, lineHeight: 32, paddingHorizontal: 4 }, sheetScroll: { flex: 1 }, sheetContent: { padding: 18, gap: 18 }, sheetContentWithFooter: { paddingBottom: 210 }, cartLine: { gap: 10, borderBottomWidth: 1, borderColor: "#e5e7eb", paddingBottom: 14 }, cartRow: { flexDirection: "row", alignItems: "center", gap: 10 }, cartName: { color: "#171717", fontSize: 16, fontWeight: "600" }, notes: { minHeight: 40, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 7, paddingHorizontal: 10, color: "#171717", fontSize: 13 }, fieldset: { gap: 9, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12 }, label: { color: "#737373", fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }, input: { minHeight: 42, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, color: "#171717", fontSize: 14 }, tableNotice: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 9, padding: 12 }, options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, choice: { minHeight: 40, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 9, justifyContent: "center", paddingHorizontal: 13, paddingVertical: 9 }, choiceSelected: { backgroundColor: "#eee", borderColor: "#171717" }, choiceText: { color: "#171717", fontSize: 14 }, choiceTextSelected: { fontWeight: "600" }, qrPayment: { alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 9, padding: 12 }, paymentQr: { width: 150, height: 150 },
  sheetFooter: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 6, backgroundColor: "#fff" }, summary: { flexDirection: "row", justifyContent: "space-between" }, totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: "#e5e7eb", paddingTop: 9, marginTop: 2 }, totalText: { color: "#171717", fontSize: 18, fontWeight: "700" }, submit: { minHeight: 46, justifyContent: "center", alignItems: "center", backgroundColor: "#171717", borderRadius: 10, paddingHorizontal: 12 }, submitText: { color: "#fff", fontWeight: "700", fontSize: 14 }, disabled: { opacity: 0.5 }, footerNote: { color: "#737373", textAlign: "center", fontSize: 11 }, error: { color: "#a95400", fontSize: 12 }, confirmOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,.55)" }, confirmCard: { width: "100%", gap: 14, borderRadius: 16, padding: 22, backgroundColor: "#fff" },
})

