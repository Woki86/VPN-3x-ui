"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { yookassa, TARIFFS } from "@/lib/yookassa"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

export async function createPayment(data: {
  tariffType: "STANDARD" | "VIP"
  months: string
  promoCode?: string
}) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Необходимо авторизоваться")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    throw new Error("Пользователь не найден")
  }

  const tariff = TARIFFS[data.tariffType][data.months as keyof typeof TARIFFS.STANDARD]
  
  if (!tariff) {
    throw new Error("Неверный тариф")
  }

  let finalPrice = tariff.price
  let bonusDays = 0

  // Применяем промокод
  if (data.promoCode && !user.promoUsed) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: data.promoCode },
    })

    if (promo && promo.isActive && (promo.maxUses === null || promo.usedCount < promo.maxUses)) {
      bonusDays = promo.bonusDays
      // Промокод будет помечен как использованный после оплаты
    }
  }

  // Создаем платеж в ЮKassa
  const paymentId = uuidv4()
  
  try {
    const payment = await yookassa.createPayment({
      amount: {
        value: finalPrice.toString(),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${process.env.NEXTAUTH_URL}/buy/success?paymentId=${paymentId}`,
      },
      description: `VPN Подписка ${tariff.name} (${data.tariffType})`,
      metadata: {
        userId: user.id,
        tariffType: data.tariffType,
        months: tariff.months.toString(),
        bonusDays: bonusDays.toString(),
        paymentId,
      },
    })

    // Сохраняем платеж в БД
    await prisma.payment.create({
      data: {
        id: paymentId,
        userId: user.id,
        amount: finalPrice,
        currency: "RUB",
        status: "pending",
        paymentId: payment.id,
      },
    })

    if (payment.confirmation?.confirmation_url) {
      redirect(payment.confirmation.confirmation_url)
    }

    throw new Error("Не удалось создать платеж")
  } catch (error) {
    console.error("Payment creation error:", error)
    throw new Error("Ошибка создания платежа")
  }
}

export async function checkPromoCode(code: string) {
  const session = await auth()
  
  if (!session?.user) {
    return { valid: false, error: "Необходимо авторизоваться" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return { valid: false, error: "Пользователь не найден" }
  }

  if (user.promoUsed) {
    return { valid: false, error: "Вы уже использовали промокод" }
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code },
  })

  if (!promo || !promo.isActive) {
    return { valid: false, error: "Промокод не найден или неактивен" }
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: "Промокод больше не действует" }
  }

  return {
    valid: true,
    bonusDays: promo.bonusDays,
    code: promo.code,
  }
}
