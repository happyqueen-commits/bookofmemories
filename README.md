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

## Авторизация и тестовые аккаунты
- Регистрация нового автора доступна на `/account` (переключатель «Вход / Регистрация»).
- После регистрации выполняется автоматический вход в личный кабинет.
- Тестовые аккаунты из seed остаются как дополнительный вариант для демо/проверки:
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
- Автор создает типизированную заявку на `/submit` с `targetEntityType`: `Person`, `ArchiveMaterial`, `Story`, `ChronicleEvent`.
- Каждая заявка валидируется как discriminated union по `targetEntityType` (разные обязательные поля для каждого типа).
- В `Submission.payloadJson` сохраняется полный структурированный payload заявки без потери полей.
- Заявка попадает в `Submission` со статусом `pending`.
- Модератор/админ на `/admin` переводит в `approved`, `needs_revision` или `rejected`.
- При `approved` публикация использует реальные данные из `payloadJson` (fallback применяется только для безопасных технических полей, например slug/частей ФИО при разборе).

Формат payload по типам:
- `Person`: `fullName`, `biography`, `shortDescription?`, `birthDate?`, `deathDate?`, `faculty?`, `department?`.
- `ArchiveMaterial`: `title`, `description`, `materialType`, `sourceInfo`, `eventDate?`, `tags[]`, `fileUrl?`, `previewImageUrl?` (требуется минимум одно из двух URL-полей).
- `Story`: `title`, `storyType`, `excerpt`, `content`, `sourceInfo?`.
- `ChronicleEvent`: `title`, `summary`, `content`, `eventDate`, `coverImageUrl?`.

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

`Submission` хранит универсальные поля (`submissionType`, `targetEntityType`, `status`, `moderatorComment`, связи с автором/модератором) и `payloadJson` с типизированным JSON по `targetEntityType`.
Это позволяет принимать расширенные заявки на создание сущностей и публиковать их без «схлопывания» данных до `title/description`.

Связи many-to-many:
- `Person ↔ ArchiveMaterial`
- `Person ↔ Story`
- `Person ↔ ChronicleEvent`

См. полную схему: `prisma/schema.prisma`.
