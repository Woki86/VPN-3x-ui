import YooKassa from '@yookassa/sdk'

export const yookassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
})

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
