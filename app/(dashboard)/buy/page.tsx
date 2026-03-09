"use client"

import { useState, useTransition } from "react"
import { TARIFFS, type TariffKey } from "@/lib/yookassa"
import { TariffCard } from "@/components/TariffCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { createPayment, checkPromoCode } from "./actions"
import { toast } from "sonner"
import { Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BuyPage() {
  const [selectedTariff, setSelectedTariff] = useState<{
    type: "STANDARD" | "VIP"
    months: string
  } | null>(null)
  
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; days: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isCheckingPromo, setIsCheckingPromo] = useState(false)

  const handleSelectTariff = (type: "STANDARD" | "VIP", months: string) => {
    setSelectedTariff({ type, months })
  }

  const handleCheckPromo = () => {
    if (!promoCode.trim()) return

    setIsCheckingPromo(true)
    startTransition(async () => {
      const result = await checkPromoCode(promoCode.trim().toUpperCase())
      
      if (result.valid) {
        setAppliedPromo({ code: result.code!, days: result.bonusDays })
        toast.success(`Промокод применен! +${result.bonusDays} дней`)
      } else {
        toast.error(result.error || "Неверный промокод")
        setAppliedPromo(null)
      }
      setIsCheckingPromo(false)
    })
  }

  const handleBuy = () => {
    if (!selectedTariff) {
      toast.error("Выберите тариф")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("tariffType", selectedTariff.type)
        formData.set("months", selectedTariff.months)
        if (appliedPromo) {
          formData.set("promoCode", appliedPromo.code)
        }

        await createPayment(formData)
      } catch (error) {
        toast.error("Ошибка создания платежа")
      }
    })
  }

  const calculateTotal = () => {
    if (!selectedTariff) return 0
    
    const tariff = TARIFFS[selectedTariff.type][selectedTariff.months as TariffKey]
    return tariff.price
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Купить подписку</h1>
        <p className="text-muted-foreground">
          Выберите подходящий тариф для доступа к VPN
        </p>
      </div>

      {/* Standard Tariffs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Обычные сервера</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(TARIFFS.STANDARD).map(([key, tariff]) => (
            <TariffCard
              key={key}
              title={`Стандарт • ${tariff.name}`}
              data={tariff}
              onSelect={(months) => handleSelectTariff("STANDARD", months)}
              selected={selectedTariff?.type === "STANDARD" && selectedTariff?.months === key}
            />
          ))}
        </div>
      </div>

      {/* VIP Tariffs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          VIP сервера
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(TARIFFS.VIP).map(([key, tariff]) => (
            <TariffCard
              key={key}
              title={`VIP • ${tariff.name}`}
              data={tariff}
              isVip
              onSelect={(months) => handleSelectTariff("VIP", months)}
              selected={selectedTariff?.type === "VIP" && selectedTariff?.months === key}
            />
          ))}
        </div>
      </div>

      {/* Promo Code & Checkout */}
      {selectedTariff && (
        <Card className="sticky bottom-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Выбранный тариф:</span>
                <span className="font-medium">
                  {selectedTariff.type} • {TARIFFS[selectedTariff.type][selectedTariff.months as TariffKey].name}
                </span>
              </div>

              {/* Promo Code Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="promo">Промокод</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="promo"
                      placeholder="WELCOME10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={isCheckingPromo || !!appliedPromo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckPromo}
                      disabled={isCheckingPromo || !!appliedPromo || !promoCode.trim()}
                    >
                      {appliedPromo ? <Check className="h-4 w-4" /> : "Применить"}
                    </Button>
                  </div>
                </div>
              </div>

              {appliedPromo && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Промокод применен: +{appliedPromo.days} дней
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-semibold">Итого:</span>
                <span className="text-2xl font-bold">{calculateTotal()} ₽</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleBuy}
                disabled={isPending}
              >
                {isPending ? "Переход к оплате..." : "Оплатить подписку"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Оплата через ЮKassa. После оплаты вы получите ключ доступа.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
