import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/config.edge"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
