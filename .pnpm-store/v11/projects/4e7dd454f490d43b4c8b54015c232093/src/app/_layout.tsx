import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react"
import { Image, StyleSheet, View } from "react-native"
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false)
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hide()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashElapsed(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if ((!fontsLoaded && !fontError) || !minimumSplashElapsed) {
    return (
      <View style={styles.splash}>
        <StatusBar style="dark" />
        <Image source={require("../../assets/primelogo.jpg")} resizeMode="cover" style={styles.splashLogo} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#D4A017" },
  splashLogo: { width: 220, height: 220, borderRadius: 110 },
})
