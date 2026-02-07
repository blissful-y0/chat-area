"use client"

import { useEffect, useRef } from "react"
import { X, UserCircle, Globe, BookOpen, Settings } from "lucide-react"
import { useUiStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "character" as const, label: "Character", icon: UserCircle },
  { id: "world" as const, label: "World", icon: Globe },
  { id: "lorebook" as const, label: "Lorebook", icon: BookOpen },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

interface ContextPanelProps {
  children: React.ReactNode
}

export function ContextPanel({ children }: ContextPanelProps) {
  const { contextPanelOpen, contextPanelTab, setContextPanelOpen, setContextPanelTab } =
    useUiStore()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        window.innerWidth < 1024 &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setContextPanelOpen(false)
      }
    }
    if (contextPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [contextPanelOpen, setContextPanelOpen])

  return (
    <>
      {/* Overlay for mobile */}
      {contextPanelOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" />
      )}

      <div
        ref={panelRef}
        className={cn(
          "flex h-full flex-col border-l",
          "fixed right-0 top-0 z-40 lg:relative lg:z-auto",
          "transition-all duration-250 ease-out",
          contextPanelOpen
            ? "w-[360px] translate-x-0 opacity-100"
            : "w-0 translate-x-full opacity-0 lg:translate-x-0 overflow-hidden border-l-0"
        )}
        style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-primary)" }}
      >
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = contextPanelTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setContextPanelTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title={tab.label}
                >
                  <Icon size={14} />
                  <span className="hidden xl:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setContextPanelOpen(false)}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
