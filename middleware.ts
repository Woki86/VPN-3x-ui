import NextAuth from "next-auth"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard") ||
                          req.nextUrl.pathname.startsWith("/keys") ||
                          req.nextUrl.pathname.startsWith("/buy") ||
                          req.nextUrl.pathname.startsWith("/referrals") ||
                          req.nextUrl.pathname.startsWith("/profile")

  // Редирект с auth страниц если авторизован
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.url))
  }

  // Редирект на signin если не авторизован и пытается зайти в dashboard
  if (isDashboardPage && !isLoggedIn) {
    const url = new URL("/auth/signin", req.url)
    url.searchParams.set("callbackUrl", req.url)
    return Response.redirect(url)
  }

  return undefined
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
