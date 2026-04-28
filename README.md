# bookofmemories

Проект на Next.js + Prisma для публикации и модерации материалов о сотрудниках, студентах и выпускниках Финансового университета.

## Что реализовано

- Публичные страницы: главная, каталог участников, карточка участника, форма отправки материала, проверка статуса заявки.
- Закрытая админская зона: модерация заявок, редактирование карточек, скрытие/восстановление карточек.
- Авторизация сотрудников редакции (роли `ADMIN` и `MODERATOR`).
- Загрузка изображений с проверкой формата/размера/сигнатуры файла и поддержкой кадрирования на клиенте.
- Ограничение частоты запросов для публичных форм и входа.

---

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` из шаблона:

```bash
cp .env.example .env
```

3. Проверьте окружение:

```bash
npm run env:check
```

4. Сгенерируйте Prisma Client и примените миграции:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

5. (Опционально) заполните базу демонстрационными данными:

```bash
npm run prisma:seed
```

6. Запустите проект:

```bash
npm run dev
```

---

## Переменные окружения (env)

Все переменные перечислены в `.env.example`.

### Обязательные

- `DATABASE_URL`
- `AUTH_SECRET` (минимум 32 символа)

### Обязательные для production

- `NEXTAUTH_URL`
- `APP_URL`
- `ALLOWED_ORIGINS`

### Серверные runtime-параметры

- `HOST`
- `PORT`

### Опциональные интеграции

- `BLOB_READ_WRITE_TOKEN` — загрузка изображений в Vercel Blob.
- `PASSWORD_RESET_EMAIL_WEBHOOK_URL` — отправка писем для сброса пароля.
- `SUBMISSION_ACCESS_EMAIL_WEBHOOK_URL` — отправка кодов для проверки статуса заявки.

> `.env` не должен попадать в Git. В репозитории хранится только `.env.example`.

---

## Prisma

Основные команды:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

Для локальной разработки допустимо использовать `prisma migrate dev`, для production — только `prisma migrate deploy`.

---

## Seed и создание админа

### Заполнение тестовыми данными

```bash
npm run prisma:seed
```

### Создание/обновление учётной записи редактора

```bash
npm run admin:create -- --email=admin@example.com --password='StrongPass123' --name='Main Admin' --role=ADMIN
```

Допустимые роли: `ADMIN`, `MODERATOR`.

---

## Production build

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start -- -H 127.0.0.1 -p 3000
```

Проверка health endpoint:

```bash
curl -f http://127.0.0.1:3000/api/health
```

---

## Deploy на сервер

Рекомендуемый порядок:

1. Подготовить PostgreSQL и выдать доступ приложению.
2. Заполнить `.env` production-значениями.
3. Выполнить `npm ci`.
4. Выполнить Prisma-команды (`generate`, `migrate:deploy`).
5. Собрать проект (`npm run build`).
6. Запустить через PM2 или Docker.
7. Настроить reverse proxy (например, Nginx) на `HOST:PORT`.
8. Проверить `/api/health`.

---

## Типичные проблемы

- **`Invalid environment configuration`**  
  Проверьте обязательные env-переменные и формат URL.

- **Ошибка подключения к БД**  
  Проверьте `DATABASE_URL`, доступность PostgreSQL и учётные данные.

- **Не работает загрузка фото**  
  Проверьте `BLOB_READ_WRITE_TOKEN`. Если токен не задан, можно использовать внешний URL изображения.

- **Server Actions блокируются в production**  
  Проверьте `ALLOWED_ORIGINS`.

- **Не отправляются письма (сброс пароля / код статуса)**  
  Проверьте webhook URL и доступность внешнего сервиса доставки.
