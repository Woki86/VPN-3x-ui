"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Shield,
  LayoutDashboard,
  Key,
  ShoppingCart,
  Users,
  User,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Обзор", href: "/dashboard", icon: LayoutDashboard },
  { name: "Мои ключи", href: "/keys", icon: Key },
  { name: "Купить", href: "/buy", icon: ShoppingCart },
  { name: "Рефералы", href: "/referrals", icon: Users },
  { name: "Профиль", href: "/profile", icon: User },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span className="font-bold">VPN Cabinet</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="grid grid-cols-5 h-14">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-0.5">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}
