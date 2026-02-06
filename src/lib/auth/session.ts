import { auth } from "./config"

export async function getRequiredSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session as typeof session & { user: { id: string } }
}

export async function getRequiredUserId(): Promise<string> {
  const session = await getRequiredSession()
  return session.user.id
}
