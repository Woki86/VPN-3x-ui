"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  name: z.string().optional(),
  referrerId: z.string().optional(),
})

export async function registerUser(formData: FormData) {
  try {
    const data = registerSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      referrerId: formData.get("referrerId"),
    })

    // Проверяем существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return { error: "Пользователь с таким email уже существует" }
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        referrerId: data.referrerId || undefined,
      },
    })

    // Если есть реферер, начисляем бонусы после первой оплаты
    // (будет обработано в webhook)

    // Автоматический вход
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Ошибка авторизации" }
    }
    
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || "Неверные данные" }
    }

    console.error("Register error:", error)
    return { error: "Ошибка регистрации" }
  }
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Неверный email или пароль" }
        default:
          return { error: "Ошибка авторизации" }
      }
    }

    console.error("Login error:", error)
    return { error: "Ошибка входа" }
  }
}
