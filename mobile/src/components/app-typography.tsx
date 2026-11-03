import { forwardRef } from "react"
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextInputProps, type TextProps } from "react-native"

const fonts: Record<string, string> = {
  normal: "Inter_400Regular",
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  "800": "Inter_700Bold",
  "900": "Inter_700Bold",
}

function withFont(style: TextProps["style"] | TextInputProps["style"]) {
  const flattened = StyleSheet.flatten(style) ?? {}
  const { fontWeight, ...rest } = flattened
  return { ...rest, fontFamily: fonts[String(fontWeight ?? "400")] ?? fonts["400"] }
}

export const Text = forwardRef<NativeText, TextProps>(function AppText({ style, ...props }, ref) {
  return <NativeText {...props} ref={ref} style={withFont(style)} />
})

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput({ style, ...props }, ref) {
  return <NativeTextInput {...props} ref={ref} style={withFont(style)} />
})
