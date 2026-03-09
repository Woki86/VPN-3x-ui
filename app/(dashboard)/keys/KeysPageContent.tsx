"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Copy, Check, Smartphone, Link as LinkIcon, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface Client {
  id: string
  email: string
  flow: string
  clientId: string
  createdAt: Date
  updatedAt: Date
  inbound: {
    id: string
    port: number
    protocol: string
    tag: string
    panel: {
      id: string
      name: string
      url: string
      isVip: boolean
    }
  }
}

interface Subscription {
  id: string
  tariffType: string
  months: number
  startDate: Date
  endDate: Date
  status: string
  bonusDays: number
  client: Client | null
}

interface KeysPageContentProps {
  subscriptions: Subscription[]
}

function QRCodeCanvas({ value }: { value: string }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const generateQR = async () => {
      const canvas = await QRCode.toCanvas(value, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: "M",
      })
      setCanvas(canvas)
    }
    generateQR()
  }, [value])

  if (!canvas) {
    return <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-lg" />
  }

  return <canvas className="w-[200px] h-[200px]" />
}

export default function KeysPageContent({ subscriptions }: KeysPageContentProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showQR, setShowQR] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Скопировано в буфер обмена")
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error("Не удалось скопировать")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-500 bg-green-500/10"
      case "EXPIRED":
        return "text-red-500 bg-red-500/10"
      case "PENDING":
        return "text-yellow-500 bg-yellow-500/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Активна"
      case "EXPIRED":
        return "Истекла"
      case "PENDING":
        return "Ожидает"
      case "CANCELLED":
        return "Отменена"
      default:
        return status
    }
  }

  const getDaysRemaining = (endDate: Date) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const generateVLESSLink = (client: Client): string => {
    const uuid = client.clientId
    const panelUrl = new URL(client.inbound.panel.url)
    const ip = panelUrl.hostname
    const port = client.inbound.port
    
    // Это пример - реальные ключи генерируются в xui-manager
    return `vless://${uuid}@${ip}:${port}?type=tcp&security=reality&pbk=YOUR_PUBLIC_KEY&fp=chrome&sni=google.com&sid=00000000000000000000000000000000&flow=xtls-rprx-vision#VPN_${client.email}`
  }

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мои ключи</h1>
          <p className="text-muted-foreground">
            Ключи доступа и конфигурации VPN
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Smartphone className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет ключей доступа</h3>
            <p className="text-muted-foreground text-center mb-4">
              Приобретите подписку чтобы получить ключ доступа
            </p>
            <Button asChild>
              <a href="/buy">Купить подписку</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Мои ключи</h1>
        <p className="text-muted-foreground">
          Ключи доступа и конфигурации VPN
        </p>
      </div>

      <div className="grid gap-6">
        {subscriptions.map((subscription) => {
          const daysRemaining = getDaysRemaining(subscription.endDate)
          const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0
          const isExpired = daysRemaining <= 0

          return (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {subscription.tariffType} • {subscription.months} мес.
                      {subscription.client?.inbound.panel.isVip && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                          VIP
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Сервер: {subscription.client?.inbound.panel.name || "Не подключен"}
                    </CardDescription>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      getStatusColor(subscription.status)
                    )}
                  >
                    {getStatusText(subscription.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(subscription.startDate), "dd.MM.yyyy", { locale: ru })} —{" "}
                      {format(new Date(subscription.endDate), "dd.MM.yyyy", { locale: ru })}
                    </span>
                  </div>
                  {daysRemaining > 0 ? (
                    <span className={cn(
                      "font-medium",
                      isExpiringSoon ? "text-red-500" : "text-green-500"
                    )}>
                      Осталось дней: {daysRemaining}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">Истекла</span>
                  )}
                </div>

                {isExpired && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Подписка истекла. Продлите для продолжения доступа.</span>
                  </div>
                )}

                {subscription.client && subscription.status === "ACTIVE" ? (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Ключ доступа (VLESS)</h4>
                      
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-xs break-all">
                            {generateVLESSLink(subscription.client)}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(generateVLESSLink(subscription.client!), subscription.id)}
                          >
                            {copiedId === subscription.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowQR(showQR === subscription.id ? null : subscription.id)}
                          >
                            <Smartphone className="mr-2 h-4 w-4" />
                            {showQR === subscription.id ? "Скрыть QR" : "Показать QR"}
                          </Button>
                        </div>

                        {showQR === subscription.id && (
                          <div className="flex justify-center pt-4">
                            <QRCodeCanvas value={generateVLESSLink(subscription.client!)} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h5 className="font-medium mb-2 text-sm">Как использовать:</h5>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Установите приложение v2rayNG (Android), V2Box (iOS) или Hiddify</li>
                        <li>Скопируйте ключ доступа или отсканируйте QR-код</li>
                        <li>Импортируйте конфигурацию в приложение</li>
                        <li>Подключитесь к серверу</li>
                      </ol>
                    </div>
                  </>
                ) : subscription.status === "PENDING" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Ключ будет сгенерирован после подтверждения оплаты</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
