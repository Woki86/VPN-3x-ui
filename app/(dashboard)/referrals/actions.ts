"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function getReferralsData() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      referrals: {
        include: {
          subscriptions: {
            where: {
              status: "ACTIVE",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      ReferralBonus: {
        include: {
          referred: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const referralLink = `${process.env.NEXTAUTH_URL}/auth/signup?ref=${user.id}`
  
  const totalReferrals = user.referrals.length
  const activeReferrals = user.referrals.filter(r => r.subscriptions.length > 0).length
  const totalBonusDays = user.bonusDays

  return {
    user,
    referralLink,
    totalReferrals,
    activeReferrals,
    totalBonusDays,
  }
}
