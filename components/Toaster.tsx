"use client"

import { useTheme } from "next-themes"
import { Toaster as SonnerToaster } from "sonner"

interface ToasterProps {}

export function Toaster({}: ToasterProps) {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system" | undefined}
      position="top-right"
      richColors
    />
  )
}
