"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getXUIManager, getAvailablePanel } from "@/lib/xui-manager"
import { v4 as uuidv4 } from "uuid"

export async function getKeysData() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            include: {
              inbound: {
                include: {
                  panel: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  return { user }
}

export async function generateVLESSLink(
  panelUrl: string,
  panelUsername: string,
  panelPassword: string,
  inboundId: number,
  clientId: string,
  remark: string
): Promise<string | null> {
  const xui = new (await import("@/lib/xui-manager")).XUIManager({
    url: panelUrl,
    username: panelUsername,
    password: panelPassword,
  })

  await xui.login()
  return await xui.generateClientLink(inboundId, clientId, remark, remark)
}

export async function createClientForSubscription(
  subscriptionId: string,
  userId: string,
  isVip: boolean
) {
  try {
    // Получаем панель
    const panel = await getAvailablePanel(isVip)
    
    if (!panel) {
      throw new Error("Нет доступных панелей")
    }

    // Получаем подписку
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    })

    if (!subscription) {
      throw new Error("Подписка не найдена")
    }

    // Получаем или создаем inbound
    let inbound = await prisma.inbound.findFirst({
      where: { panelId: panel.id },
    })

    if (!inbound) {
      // Получаем inbound из панели
      const xui = new (await import("@/lib/xui-manager")).XUIManager({
        url: panel.url,
        username: panel.username,
        password: panel.password,
      })

      await xui.login()
      const inbounds = await xui.getInbounds()
      
      if (inbounds.length === 0) {
        throw new Error("Нет доступных inbound в панели")
      }

      // Берем первый подходящий inbound
      const firstInbound = inbounds[0]
      
      inbound = await prisma.inbound.create({
        data: {
          panelId: panel.id,
          inboundId: firstInbound.id,
          tag: firstInbound.tag,
          port: firstInbound.port,
          protocol: firstInbound.protocol,
        },
      })
    }

    // Генерируем UUID для клиента
    const clientUuid = uuidv4()
    const clientEmail = `user_${userId.slice(0, 8)}_${Date.now()}`

    // Добавляем клиента в панель
    const xui = new (await import("@/lib/xui-manager")).XUIManager({
      url: panel.url,
      username: panel.username,
      password: panel.password,
    })

    await xui.login()

    const added = await xui.addClientToInbound(inbound.inboundId, {
      id: clientUuid,
      email: clientEmail,
      uuid: clientUuid,
      flow: "xtls-rprx-vision",
      enable: true,
    })

    if (!added) {
      throw new Error("Не удалось добавить клиента в панель")
    }

    // Создаем запись клиента в БД
    const client = await prisma.client.create({
      data: {
        userId,
        inboundId: inbound.id,
        clientId: clientUuid,
        email: clientEmail,
        flow: "xtls-rprx-vision",
        subscriptionId,
      },
      include: {
        inbound: {
          include: {
            panel: true,
          },
        },
      },
    })

    // Обновляем подписку
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        clientId: client.id,
        status: "ACTIVE",
      },
    })

    // Генерируем ссылку
    const panelUrlObj = new URL(panel.url)
    const link = await xui.generateClientLink(
      inbound.inboundId,
      clientUuid,
      clientEmail,
      `VPN_${userId.slice(0, 8)}`
    )

    return {
      client,
      link,
      ip: panelUrlObj.hostname,
    }
  } catch (error) {
    console.error("createClientForSubscription error:", error)
    throw error
  }
}
