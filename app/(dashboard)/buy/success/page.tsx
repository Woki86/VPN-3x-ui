import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

async function BuySuccessContent({ paymentId }: { paymentId: string }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      subscription: {
        include: {
          client: true,
        },
      },
    },
  })

  if (!payment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Платеж не найден</CardTitle>
          <CardDescription>
            К сожалению, мы не смогли найти информацию о вашем платеже
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/buy">
              Вернуться к покупке
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const subscription = payment.subscription

  return (
    <Card>
      <CardHeader className="text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <CardTitle className="text-2xl">Оплата успешна!</CardTitle>
        <CardDescription>
          Ваша подписка активирована
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-center">
          <div className="text-sm text-muted-foreground">Сумма платежа</div>
          <div className="text-2xl font-bold">{payment.amount} ₽</div>
        </div>

        {subscription && (
          <div className="border-t pt-4">
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">Тип подписки</div>
              <div className="font-medium">
                {subscription.tariffType} • {subscription.months} мес.
              </div>
              
              {subscription.client && (
                <>
                  <div className="text-sm text-muted-foreground mt-4">Ключ доступа</div>
                  <Button asChild>
                    <Link href="/keys">
                      Посмотреть ключи
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard">В кабинет</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/keys">Мои ключи</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function BuySuccessPage({
  searchParams,
}: {
  searchParams: { paymentId?: string }
}) {
  const paymentId = searchParams.paymentId

  if (!paymentId) {
    redirect("/buy")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Загрузка...</div>}>
          <BuySuccessContent paymentId={paymentId} />
        </Suspense>
      </div>
    </div>
  )
}
