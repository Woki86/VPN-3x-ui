"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { yookassa, TARIFFS } from "@/lib/yookassa"
import { v4 as uuidv4 } from "uuid"

export async function extendSubscription(subscriptionId: string, months: string) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: true,
      client: {
        include: {
          inbound: true,
        },
      },
    },
  })

  if (!subscription || subscription.userId !== session.user.id) {
    throw new Error("Подписка не найдена")
  }

  const tariff = TARIFFS[subscription.tariffType][months as keyof typeof TARIFFS.STANDARD]
  
  if (!tariff) {
    throw new Error("Неверный тариф")
  }

  // Создаем платеж
  const paymentId = uuidv4()
  
  const payment = await yookassa.createPayment({
    amount: {
      value: tariff.price.toString(),
      currency: "RUB",
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: `${process.env.NEXTAUTH_URL}/buy/success?paymentId=${paymentId}`,
    },
    description: `Продление VPN ${tariff.name} (${subscription.tariffType})`,
    metadata: {
      userId: session.user.id,
      tariffType: subscription.tariffType,
      months: tariff.months.toString(),
      subscriptionId,
      paymentId,
    },
  })

  // Сохраняем платеж
  await prisma.payment.create({
    data: {
      id: paymentId,
      userId: session.user.id,
      amount: tariff.price,
      currency: "RUB",
      status: "pending",
      paymentId: payment.id,
    },
  })

  if (payment.confirmation?.confirmation_url) {
    redirect(payment.confirmation.confirmation_url)
  }

  throw new Error("Не удалось создать платеж")
}

export async function addPanel(data: {
  name: string
  url: string
  username: string
  password: string
  isVip: boolean
}) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  // Проверка на админа (в реальном проекте добавьте роль admin)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    throw new Error("Пользователь не найден")
  }

  const panel = await prisma.panel.create({
    data: {
      name: data.name,
      url: data.url,
      username: data.username,
      password: data.password,
      isVip: data.isVip,
      isActive: true,
    },
  })

  return panel
}

export async function getPanels() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const panels = await prisma.panel.findMany({
    orderBy: { createdAt: "desc" },
  })

  return panels
}

export async function togglePanel(panelId: string, isActive: boolean) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  await prisma.panel.update({
    where: { id: panelId },
    data: { isActive },
  })

  return { success: true }
}

export async function deletePanel(panelId: string) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  await prisma.panel.delete({
    where: { id: panelId },
  })

  return { success: true }
}

export async function createPromoCode(data: {
  code: string
  bonusDays: number
  maxUses?: number
}) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  const promoCode = await prisma.promoCode.create({
    data: {
      code: data.code.toUpperCase(),
      bonusDays: data.bonusDays,
      maxUses: data.maxUses || null,
      isActive: true,
    },
  })

  return promoCode
}

export async function getPromoCodes() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  })

  return promoCodes
}

export async function togglePromoCode(promoCodeId: string, isActive: boolean) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: { isActive },
  })

  return { success: true }
}
