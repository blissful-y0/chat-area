"use client"

import { useEffect } from "react"
import { useUiStore } from "@/stores/ui-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useUiStore()

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null
    if (stored && stored !== theme) {
      setTheme(stored)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.remove("dark")
      root.classList.add("light")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  return <>{children}</>
}
