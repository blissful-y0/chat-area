import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isApi = request.nextUrl.pathname.startsWith("/api/")
      const isAuthRoute =
        request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register")
      const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth")

      if (isAuthApi || isAuthRoute) return true
      if (!isLoggedIn && isApi) return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
      if (!isLoggedIn) return false
      return true
    },
    jwt({ token, user }) {
      if (user) {
        return { ...token, userId: user.id }
      }
      return token
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}
