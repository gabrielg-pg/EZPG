"use client"

import type React from "react"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Store, Users, LogOut, Menu, X, ChevronRight, Loader2, Calendar, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/app/actions/auth-actions"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRoles?: string[]
}

export function DashboardLayout({ children, userRoles = ["user"] }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "zona_execucao"] },
    { name: "Nova Loja", href: "/nova-loja", icon: Store, roles: ["admin", "zona_execucao"] },
    { name: "Reuniões", href: "/reunioes", icon: Calendar, roles: ["admin", "comercial"] },
    { name: "Zona de Execução", href: "/zona-de-execucao", icon: Rocket, roles: ["admin", "comercial", "zona_execucao"] },
    { name: "Usuários", href: "/admin", icon: Users, roles: ["admin"] },
  ]

  const filteredNavigation = navigation.filter((item) => item.roles.some(role => userRoles.includes(role)))

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar backdrop-blur-xl border-r border-sidebar-border transform transition-all duration-300 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Image
                src="https://i.imgur.com/jfNDVLp.png"
                alt="Pro Growth Logo"
                width={40}
                height={40}
                className="rounded-xl shadow-lg shadow-primary/20"
              />
              <span className="text-lg font-bold text-white tracking-tight">Pro Growth</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <p className="px-3 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-lg")} />
                  {item.name}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isPending}
              className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-xl py-3"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Saindo...
                </>
              ) : (
                <>
                  <LogOut className="mr-3 h-5 w-5" />
                  Sair da conta
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="lg:hidden text-muted-foreground hover:text-white mr-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50" />
            <h1 className="text-xl font-semibold text-foreground">
              {filteredNavigation.find((item) => item.href === pathname)?.name || "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
