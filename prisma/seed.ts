import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Создаем тестового пользователя
  const hashedPassword = await bcrypt.hash('test123', 10)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      bonusDays: 0,
    },
  })
  
  console.log('✅ Created test user:', testUser.email)

  // Создаем тестовую панель (замените данные на свои)
  const panel = await prisma.panel.upsert({
    where: { name: 'Main' },
    update: {},
    create: {
      name: 'Main',
      url: process.env.XUI_URL || 'http://localhost:2053',
      username: process.env.XUI_USERNAME || 'admin',
      password: process.env.XUI_PASSWORD || 'admin',
      isVip: process.env.XUI_IS_VIP === 'true',
      isActive: true,
    },
  })
  
  console.log('✅ Created panel:', panel.name)

  // Создаем тестовый промокод
  const promoCode = await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      bonusDays: 10,
      isActive: true,
      maxUses: null,
    },
  })
  
  console.log('✅ Created promo code:', promoCode.code)

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
