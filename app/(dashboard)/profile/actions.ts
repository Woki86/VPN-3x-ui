"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import bcrypt from "bcrypt"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  email: z.string().email(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(6, "Новый пароль должен быть не менее 6 символов"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
})

export async function getProfileData() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      bonusDays: user.bonusDays,
      promoUsed: user.promoUsed,
      createdAt: user.createdAt,
    },
    subscriptions: user.subscriptions,
    payments: user.payments,
  }
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Необходимо авторизоваться" }
  }

  const data = profileSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
  })

  try {
    // Проверяем, не занят ли email другим пользователем
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return { error: "Email уже занят" }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name || null,
        email: data.email,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "Ошибка обновления профиля" }
  }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "Необходимо авторизоваться" }
  }

  const data = passwordSchema.parse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return { error: "Пользователь не найден" }
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password)

    if (!isPasswordValid) {
      return { error: "Неверный текущий пароль" }
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Change password error:", error)
    return { error: "Ошибка смены пароля" }
  }
}
