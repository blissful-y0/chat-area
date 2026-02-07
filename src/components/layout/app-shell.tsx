"use client"

import { Sidebar } from "./sidebar"
import { CompactSidebar } from "./compact-sidebar"

interface AppShellProps {
  children: React.ReactNode
  sidebarVariant?: "full" | "compact"
}

export function AppShell({ children, sidebarVariant = "full" }: AppShellProps) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {sidebarVariant === "full" ? <Sidebar /> : <CompactSidebar />}
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
