export interface YooKassaPayment {
  id: string
  status: string
  amount: {
    value: string
    currency: string
  }
  description: string
  metadata: Record<string, string>
  confirmation?: {
    type: string
    confirmation_url: string
  }
  created_at: string
}

export interface YooKassaNotification {
  type: string
  event: string
  object: {
    id: string
    status: string
    amount: {
      value: string
      currency: string
    }
    metadata: Record<string, string>
    created_at: string
  }
}

export interface CreatePaymentRequest {
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
