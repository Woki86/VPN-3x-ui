import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReferralLink } from "@/components/ReferralLink"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardCard } from "@/components/DashboardCard"
import { Users, Gift, Calendar, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

export default async function ReferralsPage() {
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
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const referralLink = `${process.env.NEXTAUTH_URL}/auth/signup?ref=${user.id}`
  
  const totalReferrals = user.referrals.length
  const activeReferrals = user.referrals.filter(r => r.subscriptions.length > 0).length
  const pendingReferrals = totalReferrals - activeReferrals

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Реферальная программа</h1>
        <p className="text-muted-foreground">
          Приглашайте друзей и получайте бонусные дни
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Всего рефералов"
          value={totalReferrals}
          icon={Users}
          description="Человек зарегистрировалось"
        />
        <DashboardCard
          title="Активных рефералов"
          value={activeReferrals}
          icon={TrendingUp}
          description="Оплатили подписку"
        />
        <DashboardCard
          title="Ожидают оплаты"
          value={pendingReferrals}
          icon={Calendar}
          description="Зарегистрировались, но не оплатили"
        />
        <DashboardCard
          title="Бонусных дней"
          value={user.bonusDays}
          icon={Gift}
          description={`Максимум: ${Math.min(30, user.bonusDays + activeReferrals * 12)}`}
        />
      </div>

      {/* Referral Link */}
      <ReferralLink link={referralLink} />

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Как это работает</CardTitle>
          <CardDescription>
            Простая система вознаграждений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Отправьте ссылку</h3>
              <p className="text-sm text-muted-foreground">
                Поделитесь своей реферальной ссылкой с друзьями
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Друг регистрируется</h3>
              <p className="text-sm text-muted-foreground">
                Ваш друг регистрируется по вашей ссылке
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Получите бонус</h3>
              <p className="text-sm text-muted-foreground">
                После первой оплаты друга вы оба получите +12 дней
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Ваши рефералы</CardTitle>
          <CardDescription>
            Список приглашенных пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>У вас пока нет рефералов</p>
              <p className="text-sm mt-1">
                Поделитесь ссылкой чтобы пригласить первых пользователей
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.referrals.map((referral) => {
                const hasActiveSubscription = referral.subscriptions.length > 0
                const bonusAdded = hasActiveSubscription

                return (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          bonusAdded
                            ? "bg-green-500/10 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {bonusAdded ? "✓" : referral.name?.[0]?.toUpperCase() || referral.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {referral.name || "Аноним"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {referral.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          bonusAdded ? "text-green-500" : "text-muted-foreground"
                        }`}
                      >
                        {bonusAdded ? "+12 дней" : "Ожидает оплаты"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(referral.createdAt), "dd.MM.yyyy", { locale: ru })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-orange-500" />
            Максимальный бонус
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Максимальное количество бонусных дней на аккаунте — 30.
            Текущий баланс: <span className="font-semibold text-foreground">{user.bonusDays}</span> дней.
            {user.bonusDays >= 30 && (
              <span className="text-green-500 ml-2">✓ Лимит достигнут</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
