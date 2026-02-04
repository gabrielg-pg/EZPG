"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Lock, User, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import { loginAction } from "@/app/actions/auth-actions"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await loginAction(formData)
      if (result && result.success && result.redirectTo) {
        // Use router.push for client-side navigation after successful login
        router.push(result.redirectTo)
        router.refresh()
      } else if (result && !result.success) {
        setError(result.error || "Erro ao fazer login")
      }
    })
  }

  return (
    <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10">
      <CardHeader className="space-y-4 text-center pb-2">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150" />
            <Image
              src="https://i.imgur.com/jfNDVLp.png"
              alt="Pro Growth Logo"
              width={64}
              height={64}
              className="relative z-10 rounded-2xl shadow-xl shadow-primary/20"
              priority
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground">Pro Growth</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Entre com suas credenciais para acessar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground font-medium">
              Usuario
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Digite seu usuario"
                required
                className="pl-10 h-12 bg-secondary/50 border-input rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                required
                className="pl-10 pr-10 h-12 bg-secondary/50 border-input rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Manter conectado
            </Label>
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-200"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
