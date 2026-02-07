import { create } from "zustand"

interface UiState {
  sidebarOpen: boolean
  theme: "dark" | "light"
  contextPanelOpen: boolean
  contextPanelTab: "character" | "world" | "lorebook" | "settings"
}

interface UiActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: "dark" | "light") => void
  toggleContextPanel: () => void
  setContextPanelOpen: (open: boolean) => void
  setContextPanelTab: (tab: UiState["contextPanelTab"]) => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  sidebarOpen: true,
  theme: "dark",
  contextPanelOpen: false,
  contextPanelTab: "character",

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleContextPanel: () =>
    set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
  setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
  setContextPanelTab: (tab) =>
    set({ contextPanelTab: tab, contextPanelOpen: true }),
}))
