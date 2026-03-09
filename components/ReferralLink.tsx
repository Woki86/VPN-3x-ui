"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ReferralLinkProps {
  link: string
}

export function ReferralLink({ link }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success("Ссылка скопирована!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Не удалось скопировать ссылку")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ваша реферальная ссылка</CardTitle>
        <CardDescription>
          Пригласите друзей и получите +12 бонусных дней после их первой оплаты
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-sm truncate">
            {link}
          </div>
          <Button onClick={handleCopy} variant="outline" size="icon">
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
