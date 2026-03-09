"use client"

import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TariffData } from "@/lib/yookassa"

interface TariffCardProps {
  title: string
  data: TariffData
  isVip?: boolean
  onSelect: (months: string) => void
  selected?: boolean
}

export function TariffCard({ title, data, isVip = false, onSelect, selected }: TariffCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-300 hover:shadow-lg",
        isVip && "border-orange-500 shadow-orange-500/20",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {isVip && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            🔥 VIP
          </span>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className={cn(isVip && "text-orange-500")}>{title}</CardTitle>
        <CardDescription>{data.name}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="text-center">
          <span className="text-4xl font-bold">{data.price} ₽</span>
          {data.discount && (
            <span className="ml-2 text-sm text-green-500 font-medium">{data.discount}</span>
          )}
        </div>
        
        <ul className="mt-6 space-y-3">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm">Безлимитный трафик</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm">1 устройство</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm">VLESS Reality</span>
          </li>
          {isVip && (
            <>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Приоритетная поддержка</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Мощные сервера</span>
              </li>
            </>
          )}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={isVip ? "default" : "default"}
          onClick={() => onSelect(data.months.toString())}
        >
          Выбрать на {data.months} {data.months === 1 ? 'месяц' : data.months < 5 ? 'месяца' : 'месяцев'}
        </Button>
      </CardFooter>
    </Card>
  )
}
