import { AppShell } from "@/components/layout/app-shell"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell sidebarVariant="full">{children}</AppShell>
}
