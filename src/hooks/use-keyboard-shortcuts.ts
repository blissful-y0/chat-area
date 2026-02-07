"use client"

import { useEffect } from "react"
import { useUiStore } from "@/stores/ui-store"

export function useKeyboardShortcuts() {
  const {
    toggleSidebar,
    toggleContextPanel,
    setContextPanelTab,
    setContextPanelOpen,
  } = useUiStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === "b") {
        e.preventDefault()
        toggleSidebar()
      }

      if (mod && e.key === ".") {
        e.preventDefault()
        toggleContextPanel()
      }

      if (mod && e.key >= "1" && e.key <= "4") {
        e.preventDefault()
        const tabs = ["character", "world", "lorebook", "settings"] as const
        setContextPanelTab(tabs[parseInt(e.key) - 1])
      }

      if (e.key === "Escape") {
        setContextPanelOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar, toggleContextPanel, setContextPanelTab, setContextPanelOpen])
}
