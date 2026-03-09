import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClientForSubscription } from "@/app/(dashboard)/keys/actions"
import crypto from "crypto"

interface YooKassaNotification {
  type: string
  event: string
  object: {
    id: string
    status: string
    amount: {
      value: string
      currency: string
    }
    metadata: {
      userId: string
      tariffType: string
      months: string
      bonusDays: string
      paymentId: string
    }
    created_at: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const notification = JSON.parse(body) as YooKassaNotification

    // Проверка типа уведомления
    if (notification.type !== "notification" || notification.event !== "payment.succeeded") {
      return NextResponse.json({ status: "ignored" })
    }

    const paymentData = notification.object
    const { userId, tariffType, months, bonusDays: bonusDaysStr, paymentId } = paymentData.metadata
    const bonusDays = parseInt(bonusDaysStr) || 0

    // Находим платеж в БД
    const payment = await prisma.payment.findUnique({
      where: { paymentId: paymentData.id },
    })

    if (!payment) {
      console.error("Payment not found:", paymentData.id)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Обновляем статус платежа
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "succeeded" },
    })

    // Создаем подписку
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + parseInt(months))
    
    // Добавляем бонусные дни
    if (bonusDays > 0) {
      endDate.setDate(endDate.getDate() + bonusDays)
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tariffType: tariffType as "STANDARD" | "VIP",
        months: parseInt(months),
        startDate,
        endDate,
        status: "PENDING",
        bonusDays,
        paymentId: payment.id,
      },
    })

    // Создаем клиента в 3x-ui
    const isVip = tariffType === "VIP"
    
    try {
      const result = await createClientForSubscription(
        subscription.id,
        userId,
        isVip
      )

      if (result) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "ACTIVE" },
        })
      }
    } catch (error) {
      console.error("Failed to create client in 3x-ui:", error)
      // Не прерываем процесс, статус останется PENDING
    }

    // Если есть реферер, начисляем бонусы
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (user?.referrerId) {
      const referrer = await prisma.user.findUnique({
        where: { id: user.referrerId },
      })

      if (referrer) {
        // Проверяем, не начислялись ли уже бонусы за этого реферала
        const existingBonus = await prisma.referralBonus.findUnique({
          where: {
            referrerId_referredId: {
              referrerId: referrer.id,
              referredId: user.id,
            },
          },
        })

        if (!existingBonus) {
          // Начисляем бонусы рефереру (+12 дней)
          const newBonusDays = Math.min(30, referrer.bonusDays + 12)
          
          await prisma.user.update({
            where: { id: referrer.id },
            data: {
              bonusDays: newBonusDays,
            },
          })

          await prisma.referralBonus.create({
            data: {
              referrerId: referrer.id,
              referredId: user.id,
              daysAdded: 12,
            },
          })

          // Начисляем бонусы новому пользователю тоже (+12 дней)
          const newUserBonusDays = Math.min(30, user.bonusDays + 12)
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              bonusDays: newUserBonusDays,
            },
          })
        }
      }
    }

    // Если использован промокод, помечаем как использованный и увеличиваем счетчик
    if (bonusDays > 0 && !user?.promoUsed) {
      await prisma.user.update({
        where: { id: userId },
        data: { promoUsed: true },
      })

      // Находим промокод и увеличиваем счетчик использований
      // (в реальном проекте нужно хранить ID использованного промокода)
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
