# Книга участников — MVP

MVP информационного мемориально-архивного сайта «Книга участников: Жизнь Финансового университета во времена СВО».

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
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token"
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
- Самостоятельная регистрация отключена (`registerAction` в `lib/actions.ts` всегда возвращает ошибку).
- Вход в `/account` доступен только пользователям с ролями `MODERATOR` и `ADMIN`.
- Пользователи с другими ролями (в т.ч. `AUTHOR`) не проходят авторизацию через Credentials provider.
- Тестовые аккаунты из `prisma/seed.ts`:
  - MODERATOR: `moderator@book.local` / `moderator123`
  - ADMIN: `admin@book.local` / `admin123`

## Реализованные маршруты
- `/`
- `/memory`
- `/submit`
- `/submission-status`
- `/about`
- `/account`
- `/admin`
- `/api/auth/[...nextauth]`

## Что не входит в MVP сейчас
- Публичные разделы `/archive`, `/stories`, `/chronicle` и их detail-страницы.
- Прием и публикация заявок с `targetEntityType` = `ArchiveMaterial` и `ChronicleEvent`.
- Полноценный пользовательский self-signup поток.
- Эти направления запланированы как следующие этапы после стабилизации текущего MVP.

## Модерация
- В текущем MVP прием и публикация поддерживаются только для `targetEntityType`: `Person` и `Story`.
- Для неподдерживаемых типов (`ArchiveMaterial`, `ChronicleEvent`) система возвращает явную ошибку валидации/публикации.
- Каждая поддерживаемая заявка валидируется как discriminated union по `targetEntityType`.
- В `Submission.payloadJson` сохраняется полный структурированный payload заявки без потери полей.
- Заявка попадает в `Submission` со статусом `pending`.
- Для каждой новой заявки генерируется одноразовый длинный токен доступа к статусу: в БД хранится только `accessTokenHash`, а пользователю показывается только raw-токен в защищенной ссылке.
- Страница `/submission-status` принимает `token` (и опционально `email`), проверяет только hash токена и не раскрывает, существует ли конкретный email при ошибке.
- У токена есть срок жизни (`accessTokenExpiresAt`), а при успешной проверке выполняется ротация токена (выдается новая ссылка).
- Модератор/админ на `/admin` переводит в `approved`, `needs_revision` или `rejected`.
- При `approved` публикация использует реальные данные из `payloadJson` (fallback применяется только для безопасных технических полей, например slug/частей ФИО при разборе).

Формат payload по поддерживаемым типам:
- `Person`: `fullName`, `biography`, `shortDescription?`, `birthDate?`, `deathDate?`, `faculty?`, `department?`, `photoUrls[]`.
- `Story`: `title`, `storyType`, `excerpt`, `content`, `sourceInfo?`.

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

`Submission` хранит универсальные поля (`submissionType`, `targetEntityType`, `status`, `moderatorComment`, связи с автором/модератором), `payloadJson` с типизированным JSON по `targetEntityType`, а также `accessTokenHash` + `accessTokenExpiresAt` для безопасного просмотра статуса по токену.
Это позволяет принимать расширенные заявки на создание сущностей и публиковать их без «схлопывания» данных до `title/description`.

Связи many-to-many:
- `Person ↔ ArchiveMaterial`
- `Person ↔ Story`
- `Person ↔ ChronicleEvent`

См. полную схему: `prisma/schema.prisma`.
