import { redirect } from "next/navigation"
import { getDashboardData } from "./actions"
import { DashboardCard } from "@/components/DashboardCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Clock, Users, ArrowRight, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

export default async function DashboardPage() {
  const data = await getDashboardData()
  
  const { user, activeSubscriptions, totalReferrals } = data

  // Получаем ближайшую подписку к истечению
  const nearestSubscription = activeSubscriptions
    .filter((s) => new Date(s.endDate) > new Date())
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]

  const daysUntilExpiry = nearestSubscription
    ? Math.ceil((new Date(nearestSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Привет, {user.name || user.email}!
        </h1>
        <p className="text-muted-foreground">
          Добро пожаловать в личный кабинет VPN
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Активные подписки"
          value={activeSubscriptions.length}
          icon={Key}
          description={
            activeSubscriptions.length > 0
              ? `${activeSubscriptions.length} активн${activeSubscriptions.length === 1 ? 'ая' : activeSubscriptions.length < 5 ? 'ых' : 'ых'}`
              : "Нет активных подписок"
          }
        />
        
        <DashboardCard
          title="Дней до конца"
          value={daysUntilExpiry !== null ? daysUntilExpiry : "—"}
          icon={Clock}
          description={
            daysUntilExpiry !== null
              ? daysUntilExpiry < 3
                ? "Срочно продлите!"
                : daysUntilExpiry < 7
                ? "Осталось мало времени"
                : "Всё в порядке"
              : "Нет активных подписок"
          }
        />
        
        <DashboardCard
          title="Рефералов"
          value={totalReferrals}
          icon={Users}
          description={
            totalReferrals > 0
              ? `+${totalReferrals * 12} бонусных дней`
              : "Пригласите друзей"
          }
        />
      </div>

      {/* Active Subscription Alert */}
      {daysUntilExpiry !== null && daysUntilExpiry < 7 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle className="text-lg text-destructive">
                Подписка истекает скоро
              </CardTitle>
              <CardDescription className="text-destructive/70">
                Осталось дней: {daysUntilExpiry}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/buy">
                Продлить подписку
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/keys">
                <Key className="mr-2 h-4 w-4" />
                Посмотреть ключи доступа
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/buy">
                <ArrowRight className="mr-2 h-4 w-4" />
                Купить новую подписку
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/referrals">
                <Users className="mr-2 h-4 w-4" />
                Пригласить друзей
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ваши подписки</CardTitle>
            <CardDescription>
              Последние активные подписки
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">У вас нет активных подписок</p>
                <Button asChild className="mt-4">
                  <Link href="/buy">Купить подписку</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubscriptions.slice(0, 3).map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {subscription.tariffType} • {subscription.months} мес.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        До {format(new Date(subscription.endDate), "dd MMMM yyyy", { locale: ru })}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/keys">Ключи</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
