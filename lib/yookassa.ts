import crypto from 'crypto'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY

if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
  console.warn('⚠️ YooKassa credentials not configured. Payments will not work.')
}

const YOOKASSA_AUTH = YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY 
  ? Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
  : ''

const YOOKASSA_BASE_URL = 'https://api.yookassa.ru/v3'

interface CreatePaymentRequest {
  amount: {
    value: string
    currency: string
  }
  capture: boolean
  confirmation: {
    type: string
    return_url: string
  }
  description: string
  metadata: Record<string, string>
}

interface CreatePaymentResponse {
  id: string
  status: string
  amount: {
    value: string
    currency: string
  }
  confirmation?: {
    type: string
    confirmation_url: string
  }
  created_at: string
}

export async function createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  if (!YOOKASSA_AUTH) {
    throw new Error('YooKassa credentials not configured')
  }

  const response = await fetch(`${YOOKASSA_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': crypto.randomUUID(),
      'Authorization': `Basic ${YOOKASSA_AUTH}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ description: 'Unknown error' }))
    throw new Error(error.description || 'Ошибка создания платежа')
  }

  return response.json()
}

export const TARIFFS = {
  STANDARD: {
    '1': { months: 1, price: 120, name: '1 месяц' },
    '3': { months: 3, price: 324, name: '3 месяца', discount: '-10%' },
    '6': { months: 6, price: 612, name: '6 месяцев', discount: '-15%' },
    '12': { months: 12, price: 1224, name: '12 месяцев', discount: '-15%' },
  },
  VIP: {
    '1': { months: 1, price: 200, name: '1 месяц' },
    '3': { months: 3, price: 540, name: '3 месяца', discount: '-10%' },
    '6': { months: 6, price: 1020, name: '6 месяцев', discount: '-15%' },
    '12': { months: 12, price: 2040, name: '12 месяцев', discount: '-15%' },
  },
}

export type TariffKey = keyof typeof TARIFFS.STANDARD
export type TariffData = typeof TARIFFS.STANDARD[TariffKey]
