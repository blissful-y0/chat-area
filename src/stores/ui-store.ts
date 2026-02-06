import { create } from "zustand"

interface UiState {
  sidebarOpen: boolean
  theme: "dark" | "light"
}

interface UiActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: "dark" | "light") => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  sidebarOpen: true,
  theme: "dark",

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}))
