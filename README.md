# VPN Cabinet — Личный кабинет клиента для продажи VPN-подписок

Веб-приложение для управления VPN-подписками на базе 3x-ui панели с интеграцией ЮKassa.

## 🚀 Стек технологий

- **Frontend:** Next.js 15 (App Router, Server Components + Server Actions)
- **Язык:** TypeScript (строгий режим)
- **Стили:** Tailwind CSS + shadcn/ui
- **Иконки:** Lucide-react
- **База данных:** PostgreSQL + Prisma ORM
- **Авторизация:** NextAuth.js v5 (Credentials provider)
- **Платежи:** @yookassa/sdk
- **QR-коды:** qrcode
- **Валидация:** zod + react-hook-form
- **Уведомления:** sonner

## 📋 Требования

- Node.js 18+
- PostgreSQL 14+ (или SQLite для разработки)
- 3x-ui панель с поддержкой VLESS Reality
- Аккаунт в ЮKassa (для продакшена)

## 🔧 Как запустить проект

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

**Обязательные переменные:**

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vpn_3x_ui?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"

# YooKassa (для тестов можно не заполнять)
YOOKASSA_SHOP_ID="your_shop_id"
YOOKASSA_SECRET_KEY="your_secret_key"
YOOKASSA_RETURN_URL="http://localhost:3000/buy/success"

# 3x-ui панель
XUI_URL="http://localhost:2053"
XUI_USERNAME="admin"
XUI_PASSWORD="your_password"
XUI_IS_VIP="false"
```

### 3. Генерация NextAuth Secret

```bash
openssl rand -base64 32
```

Или используйте:
```bash
npx auth secret
```

### 4. Инициализация базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение схемы к БД
npm run db:push

# Заполнение тестовыми данными (создает тестового пользователя и промокод)
npm run db:seed
```

**Тестовый пользователь после seed:**
- Email: `test@example.com`
- Пароль: `test123`

### 5. Запуск разработки

```bash
npm run dev
```

Приложение доступно по адресу: http://localhost:3000

### 6. Сборка для продакшена

```bash
npm run build
npm start
```

---

## 🖥️ Как добавить новый сервер (обычный / VIP)

### Через базу данных (рекомендуется)

1. Подключитесь к PostgreSQL:

```bash
psql -U postgres -d vpn_3x_ui
```

2. Добавьте панель:

```sql
-- Обычный сервер
INSERT INTO "Panel" (id, name, url, username, password, "isVip", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Main Server',
  'http://192.168.1.100:2053',
  'admin',
  'panel_password',
  false,
  true,
  NOW(),
  NOW()
);

-- VIP сервер
INSERT INTO "Panel" (id, name, url, username, password, "isVip", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'VIP Server',
  'http://192.168.1.101:2053',
  'admin',
  'panel_password',
  true,
  true,
  NOW(),
  NOW()
);
```

### Через переменные окружения (для одной панели)

```env
XUI_URL="http://your-panel-ip:2053"
XUI_USERNAME="admin"
XUI_PASSWORD="your_password"
XUI_IS_VIP="true"  # false для обычного сервера
```

### Требования к 3x-ui панели:

1. Должен быть создан inbound с протоколом **VLESS**
2. Настроен **Reality** с параметрами:
   - `serverNames` (SNI)
   - `publicKey` / `privateKey`
   - `shortIds`
3. Flow: `xtls-rprx-vision`

---

## 💳 Как протестировать оплату (тестовый режим ЮKassa)

### 1. Тестовые данные ЮKassa

ЮKassa предоставляет тестовый режим. Используйте:

- **ShopID:** `your_test_shop_id`
- **Secret Key:** `test_secret_key`

### 2. Тестовые банковские карты

| Номер карты | Статус |
|------------|--------|
| 5185300000000000 | Успешная оплата |
| 5350460000000001 | Отказ (недостаточно средств) |
| 5555555555550002 | Требует подтверждения (3DS) |

Любой срок действия и CVV.

### 3. Локальное тестирование webhook

Для тестирования webhook на локальном сервере используйте ngrok:

```bash
# Установка ngrok
npm install -g ngrok

# Запуск туннеля
ngrok http 3000
```

Полученный URL (например, `https://abc123.ngrok.io`) укажите:
1. В `.env`: `NEXTAUTH_URL="https://abc123.ngrok.io"`
2. В настройках ЮKassa как URL для уведомлений: `https://abc123.ngrok.io/api/webhook/yookassa`

### 4. Проверка webhook

После успешной оплаты проверьте логи:

```bash
# Логи Next.js
# В консоли где запущен npm run dev

# Или проверьте статус платежа в БД
psql -U postgres -d vpn_3x_ui -c "SELECT * FROM \"Payment\" ORDER BY \"createdAt\" DESC LIMIT 1;"
```

---

## 🎟️ Как создать и применить промокод

### Создание промокода

#### Через базу данных:

```sql
INSERT INTO "PromoCode" (id, code, "bonusDays", "isActive", "maxUses", "usedCount", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'WELCOME10',
  10,
  true,
  NULL,  -- NULL для безлимитного использования
  0,
  NOW(),
  NOW()
);
```

#### Промокод с ограничением:

```sql
INSERT INTO "PromoCode" (id, code, "bonusDays", "isActive", "maxUses", "usedCount", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'SALE20',
  10,
  true,
  100,  -- Максимум 100 использований
  0,
  NOW(),
  NOW()
);
```

### Применение промокода

1. Зарегистрируйтесь или войдите в систему
2. Перейдите на страницу `/buy`
3. Выберите тариф
4. Введите промокод в поле "Промокод"
5. Нажмите "Применить"
6. Промокод добавит +10 дней к подписке

### Ограничения:

- Один промокод на пользователя
- Максимум 30 бонусных дней на аккаунте
- Промокод можно использовать только один раз

---

## 👥 Как проверить реферальную систему

### 1. Получение реферальной ссылки

1. Войдите в систему
2. Перейдите на страницу `/referrals`
3. Скопируйте вашу реферальную ссылку вида:
   ```
   http://localhost:3000/auth/signup?ref=YOUR_USER_ID
   ```

### 2. Тестирование реферальной системы

#### Шаг 1: Регистрация реферала

1. Откройте ссылку в режиме инкогнито
2. Зарегистрируйте нового пользователя
3. Новый пользователь автоматически привязывается к рефереру

#### Шаг 2: Первая оплата

1. Войдите как новый пользователь
2. Купите любую подписку на странице `/buy`
3. Дождитесь подтверждения оплаты (webhook)

#### Шаг 3: Проверка начисления бонусов

1. Войдите как реферер
2. Перейдите на `/referrals`
3. Проверьте:
   - Счетчик активных рефералов увеличился
   - Бонусные дни увеличились на +12
   - Реферал отображается в списке со статусом "+12 дней"

#### Шаг 4: Проверка у нового пользователя

1. Войдите как новый пользователь
2. Перейдите на `/profile`
3. Проверьте баланс бонусных дней (+12 за первую оплату по реферальной ссылке)

### 3. Ограничения реферальной системы

- Максимум 30 бонусных дней на аккаунте
- Бонусы начисляются только после первой оплаты реферала
- Реферер и реферал получают по +12 дней

### 4. SQL для проверки

```sql
-- Проверка рефералов пользователя
SELECT 
  u.email,
  COUNT(r.id) as referral_count,
  u."bonusDays"
FROM "User" u
LEFT JOIN "User" r ON r."referrerId" = u.id
WHERE u.id = 'USER_ID'
GROUP BY u.id;

-- Проверка начисленных бонусов
SELECT * FROM "ReferralBonus" 
WHERE "referrerId" = 'USER_ID'
ORDER BY "createdAt" DESC;
```

---

## 📁 Структура проекта

```
VPN_3x-ui/
├── app/
│   ├── (auth)/
│   │   ├── signin/
│   │   ├── signup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── keys/
│   │   ├── buy/
│   │   ├── referrals/
│   │   ├── profile/
│   ├── api/
│   │   └── webhook/yookassa/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── TariffCard.tsx
│   ├── DashboardCard.tsx
│   ├── ReferralLink.tsx
│   └── ...
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── yookassa.ts
│   └── xui-manager.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── ...
```

---

## 🔐 Безопасность

- Пароли хэшируются через bcrypt
- Сессии защищены через NEXTAUTH_SECRET
- Все API-роуты защищены
- Server Actions для критических операций
- Валидация данных через zod

---

## 📝 Лицензия

MIT

---

## 🤝 Поддержка

Вопросы и предложения: создайте issue в репозитории
