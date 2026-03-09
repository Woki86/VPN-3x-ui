"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { registerUser } from "./actions"
import { toast } from "sonner"

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  name: z.string().optional().or(z.literal("")),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    
    const formData = new FormData()
    formData.set("email", data.email)
    formData.set("password", data.password)
    formData.set("name", data.name || "")
    
    // Получаем referrerId из URL
    const referrerId = searchParams.get("ref")
    if (referrerId) {
      formData.set("referrerId", referrerId)
    }

    startTransition(async () => {
      const result = await registerUser(formData)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else if (result.success) {
        toast.success("Регистрация успешна!")
        router.push("/dashboard")
        router.refresh()
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт для доступа к VPN
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isPending}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Имя (необязательно)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ваше имя"
                disabled={isPending}
                {...register("name")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isPending}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
