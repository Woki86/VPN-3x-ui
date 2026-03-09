"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function getDashboardData() {
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
              inbound: true,
            },
          },
        },
      },
      referrals: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const activeSubscriptions = user.subscriptions.filter(
    (s) => s.status === "ACTIVE"
  )
  
  const totalReferrals = user.referrals.length

  return {
    user,
    activeSubscriptions,
    totalReferrals,
  }
}
