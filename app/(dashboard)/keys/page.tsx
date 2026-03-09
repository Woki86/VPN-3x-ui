import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import KeysPageContent from "./KeysPageContent"

export default async function KeysPage() {
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

  return <KeysPageContent subscriptions={user.subscriptions} />
}
