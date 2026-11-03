import Ionicons from "@expo/vector-icons/Ionicons"
import MapView, { Marker, type Region } from "react-native-maps"
import { useEffect, useRef, useState } from "react"
import { Modal, Pressable, StyleSheet, View } from "react-native"
import { Text } from "./app-typography"

type Props = {
  latitude: number | null
  longitude: number | null
  busy: boolean
  onSelect: (latitude: number, longitude: number) => void
  onCurrentLocation: () => void
}

const DEFAULT_REGION: Region = { latitude: 14.5995, longitude: 120.9842, latitudeDelta: 0.025, longitudeDelta: 0.025 }

export default function DeliveryMap({ latitude, longitude, busy, onSelect, onCurrentLocation }: Props) {
  const centerLatitude = latitude ?? DEFAULT_REGION.latitude
  const centerLongitude = longitude ?? DEFAULT_REGION.longitude
  const mapRef = useRef<MapView | null>(null)
  const [isPicking, setIsPicking] = useState(false)
  const [pickerRegion, setPickerRegion] = useState<Region>({ ...DEFAULT_REGION, latitude: centerLatitude, longitude: centerLongitude })

  useEffect(() => {
    if (latitude == null || longitude == null) return
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: DEFAULT_REGION.latitudeDelta, longitudeDelta: DEFAULT_REGION.longitudeDelta })
  }, [latitude, longitude])

  const openPicker = () => {
    setPickerRegion({ ...DEFAULT_REGION, latitude: centerLatitude, longitude: centerLongitude })
    setIsPicking(true)
  }
  const confirmPicker = () => {
    onSelect(pickerRegion.latitude, pickerRegion.longitude)
    setIsPicking(false)
  }

  return <View style={styles.container}>
    <MapView
      style={styles.preview}
      initialRegion={{ ...DEFAULT_REGION, latitude: centerLatitude, longitude: centerLongitude }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={openPicker}
    >
      {latitude != null && longitude != null && <Marker coordinate={{ latitude, longitude }} title="Delivery location" />}
    </MapView>
    <Pressable accessibilityRole="button" onPress={openPicker} style={styles.selectButton}>
      <Text style={styles.selectButtonText}>Select location on map</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={onCurrentLocation} disabled={busy} style={styles.button}>
      <Text style={styles.buttonText}>{busy ? "Getting location…" : "Use my current location"}</Text>
    </Pressable>

    <Modal visible={isPicking} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsPicking(false)}>
      <View style={styles.fullScreen}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={pickerRegion}
          onRegionChangeComplete={setPickerRegion}
        />
        <View pointerEvents="none" style={styles.centerPin}>
          <Ionicons name="location-sharp" size={42} color="#e84c36" />
        </View>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel location selection" onPress={() => setIsPicking(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#222" />
          </Pressable>
          <Text style={styles.title}>Select delivery location</Text>
        </View>
        <View style={styles.bottomBar}>
          <Pressable accessibilityRole="button" onPress={onCurrentLocation} disabled={busy} style={[styles.locationButton, busy && styles.disabled]}>
            <Ionicons name="locate" size={18} color="#333" />
            <Text style={styles.locationButtonText}>{busy ? "Getting location…" : "My location"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={confirmPicker} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm location</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  preview: { height: 220, borderRadius: 10, overflow: "hidden" },
  selectButton: { alignSelf: "flex-start", backgroundColor: "#e96032", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  selectButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  button: { alignSelf: "flex-start", backgroundColor: "#ff9900", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: "#171717", fontWeight: "700", fontSize: 13 },
  fullScreen: { flex: 1, backgroundColor: "#fff" },
  centerPin: { position: "absolute", top: "50%", left: "50%", marginLeft: -21, marginTop: -42 },
  topBar: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 10, padding: 8, elevation: 4 },
  backButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, color: "#222", fontSize: 16, fontWeight: "700" },
  bottomBar: { position: "absolute", left: 12, right: 12, bottom: 18, flexDirection: "row", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 10, elevation: 5 },
  locationButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#ff9900", borderRadius: 8, padding: 12 },
  locationButtonText: { color: "#222", fontWeight: "700" },
  disabled: { opacity: 0.55 },
  confirmButton: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#e96032", borderRadius: 8, padding: 12 },
  confirmButtonText: { color: "#fff", fontWeight: "700" },
})
