# Книга памяти — MVP

MVP информационного мемориально-архивного сайта «Книга памяти: Жизнь Финансового университета во времена СВО».

## Стек
- Next.js 14 App Router
- TypeScript + React + Tailwind
- PostgreSQL + Prisma
- Auth.js (NextAuth Credentials)
- Zod

## Быстрый старт
1. Установить зависимости:
```bash
npm install
```
2. Создать `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookofmemories?schema=public"
AUTH_SECRET="replace-with-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```
3. Применить миграцию и сгенерировать Prisma Client:
```bash
npm run prisma:generate
npx prisma migrate deploy
```
4. Заполнить тестовыми данными:
```bash
npm run prisma:seed
```
5. Запустить:
```bash
npm run dev
```

## Роли и тестовые аккаунты
- AUTHOR: `author@example.com` / `author123`
- MODERATOR: `moderator@example.com` / `moderator123`
- ADMIN: `admin@example.com` / `admin123`

## Реализованные маршруты
- `/`
- `/memory`, `/memory/[slug]`
- `/archive`, `/archive/[slug]`
- `/stories`, `/stories/[slug]`
- `/chronicle`, `/chronicle/[slug]`
- `/about`
- `/submit`
- `/account`
- `/admin`
- `/api/auth/[...nextauth]`

## Модерация
- Автор создает заявку на `/submit`.
- Заявка попадает в `Submission` со статусом `pending`.
- Модератор/админ на `/admin` переводит в `approved`, `needs_revision` или `rejected`.
- При `approved` материал публикуется в соответствующей сущности и появляется в публичных разделах.

## Поиск и фильтрация
- Поиск реализован в публичных разделах через query параметр `q`.
- В архиве есть фильтрация по `type` (материалу).

## Структура БД
Основные сущности:
- `User`
- `Person`
- `ArchiveMaterial`
- `Story`
- `ChronicleEvent`
- `Submission`

Связи many-to-many:
- `Person ↔ ArchiveMaterial`
- `Person ↔ Story`
- `Person ↔ ChronicleEvent`

См. полную схему: `prisma/schema.prisma`.
