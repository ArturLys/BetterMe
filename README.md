# BetterMe

Адмін-панель + клієнтський інтерфейс для доставки wellness-наборів дронами.

## Що потрібно

- Node.js 18+
- Docker
- Java 21 (якщо запускаєте бек без Docker)
- Акаунт на [Supabase](https://supabase.com)

## Supabase

1. Зареєструйтесь на [supabase.com](https://supabase.com)
2. Створіть новий проєкт, запам'ятайте пароль БД
3. Знайдіть три речі:

| Що           | Де шукати                                               |
| ------------ | ------------------------------------------------------- |
| Project URL  | Settings → API → Project URL                            |
| Anon Key     | Settings → API → `anon` `public` key (див. скрін нижче) |
| Database URL | Settings → Database → Connection string (URI)           |

![Де знайти Anon Key](./supabase_anonkey.png)

## Бекенд

# 🚁 Placeholder Drones Backend

Backend-сервіс для управління доставкою дронів, замовленнями, оплатами та відстеженням руху дронів у реальному часі.

Проєкт побудований на **Spring Boot 4**, **Hibernate 7**, **PostgreSQL** та готовий до деплою через **Docker / Railway / Supabase**.

---

## ✨ Основний функціонал

- 📦 Створення та управління замовленнями
- 🔎 Фільтрація замовлень через JPA Specifications
- 📊 Статистика замовлень
- 🚁 Автоматичне призначення дронів
- 📍 Симуляція руху дрона
- 🔁 Логіка повернення дрона на базу
- 🔐 JWT-аутентифікація
- 📄 Масовий імпорт замовлень з CSV
- 📑 Пагінація
- 🧾 Розрахунок податку залежно від географії
- 🗄 Повна сумісність з PostgreSQL (Supabase)

---

## 🛠 Технології

- Java 21
- Spring Boot 4
- Spring Security
- Spring Data JPA
- Hibernate 7
- PostgreSQL
- Docker
- Railway

---

## ⚙️ Необхідні змінні середовища

Приклад для запуску:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
JWT_SECRET=your_secret_key
```
 🐳 Запуск через Dockerr
 
⃣Збірка образу

```
docker build -t placeholder-drones .
```
Запуск контейнера
```
docker run -p 8080:8080 \
-e SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/db \
-e SPRING_DATASOURCE_USERNAME=postgres \
-e SPRING_DATASOURCE_PASSWORD=password \
-e SPRING_JPA_HIBERNATE_DDL_AUTO=validate \
-e JWT_SECRET=secret \
placeholder-drones
```
Після запуску API буде доступне на:

http://localhost:8080


## Фронтенд

```bash
cd frontend
npm install
cp .env.example .env
```

Заповніть `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...ваш_ключ
VITE_API_URL=http://localhost:8080
```

> `VITE_API_URL` — адреса Spring бекенду

```bash
npm run dev
```

Відкрийте `http://localhost:5173`.

## Структура

```
frontend/src/
├── pages/
│   ├── Home.tsx          # Головна
│   ├── OrderPage.tsx     # Замовлення (карта + вибір набору)
│   ├── TrackPage.tsx     # Відстеження
│   └── admin/
│       ├── Login.tsx     # Вхід в адмінку
│       └── Dashboard.tsx # Таблиця замовлень
├── context/              # Auth, i18n, тема, тости
├── services/api.ts       # Клієнт до Spring API
└── client.ts             # Supabase клієнт
```

## Стек

|             |                                                    |
| ----------- | -------------------------------------------------- |
| Фронт       | React 19, Vite, TypeScript, Tailwind v4, shadcn/ui |
| Карти       | Leaflet, OpenStreetMap, Nominatim                  |
| Авторизація | Supabase Auth (JWT)                                |
| Бек         | Spring Boot, Java 21, Gradle                       |
| БД          | PostgreSQL (Supabase)                              |

## Рішення та припущення

- Авторизація через Supabase Auth. Бек може перевіряти JWT токени Supabase.
- Геокодинг через Nominatim (OpenStreetMap) — безкоштовно, без API ключа.
- Типи наборів: Default, Default+, Silver, Silver+, Gold, Gold+, Platinum, Platinum+.
- Адмінка на `/admin`, клієнтська частина на `/`.