"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Mail, Calendar, Key, CreditCard, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { updateProfile, changePassword } from "./actions"

const profileSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  email: z.string().email("Неверный формат email"),
})

type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(6, "Минимум 6 символов"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
})

type PasswordForm = z.infer<typeof passwordSchema>

interface ProfilePageProps {
  user: {
    id: string
    email: string
    name: string | null
    bonusDays: number
    promoUsed: boolean
    createdAt: Date
  }
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [isPending, startTransition] = useTransition()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email,
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = (data: ProfileForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("name", data.name || "")
      formData.set("email", data.email)

      const result = await updateProfile(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Профиль обновлен")
      }
    })
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("currentPassword", data.currentPassword)
      formData.set("newPassword", data.newPassword)
      formData.set("confirmPassword", data.confirmPassword)

      const result = await changePassword(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Пароль изменен")
        resetPassword()
        setShowPasswordForm(false)
      }
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground">
          Управление настройками аккаунта
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Имя</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{user.name || "Не указано"}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Дата регистрации</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(user.createdAt), "dd MMMM yyyy", { locale: ru })}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Бонусные дни</Label>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.bonusDays} дней</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Промокод</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>{user.promoUsed ? "Использован" : "Не использован"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Редактировать профиль</CardTitle>
            <CardDescription>
              Измените данные вашего аккаунта
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  disabled={isPending}
                  {...registerProfile("name")}
                />
                {profileErrors.name && (
                  <p className="text-sm text-destructive">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={isPending}
                  {...registerProfile("email")}
                />
                {profileErrors.email && (
                  <p className="text-sm text-destructive">{profileErrors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Безопасность
          </CardTitle>
          <CardDescription>
            Управление паролем
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)} variant="outline">
              Изменить пароль
            </Button>
          ) : (
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  disabled={isPending}
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <Input
                  id="newPassword"
                  type="password"
                  disabled={isPending}
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  disabled={isPending}
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Изменение..." : "Изменить пароль"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetPassword()
                    setShowPasswordForm(false)
                  }}
                  disabled={isPending}
                >
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            История платежей
          </CardTitle>
          <CardDescription>
            Последние транзакции
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Раздел в разработке...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
