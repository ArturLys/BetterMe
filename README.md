# BetterMe https://better-me-nt4p.vercel.app/

Адмін-панель + клієнтський інтерфейс для доставки wellness-наборів дронами.

Щоб увійти в адмін панель використати пароль і логін admin admin
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

Backend-сервіс для управління доставкою дронів, замовленнями, оплатами та симуляцією руху дронів у реальному часі.

Проєкт побудований на **Spring Boot 4**, **Hibernate 7** та **PostgreSQL**.
Підтримує JWT-аутентифікацію через HttpOnly cookie та готовий до деплою через Docker / Railway / Supabase.

---

# ✨ Основний функціонал

* 📦 Створення та управління замовленнями
* 🔎 Динамічна фільтрація через JPA Specifications
* 📊 Статистика замовлень
* 🚁 Автоматичне призначення дронів
* 📍 Симуляція руху дрона
* 🔁 Логіка повернення дрона на базу
* 🔐 JWT-аутентифікація (cookie-based)
* 📄 Масовий імпорт замовлень з CSV
* 📑 Пагінація
* 🧾 Розрахунок податку залежно від географії
* 🗄 Повна сумісність з PostgreSQL (Supabase-ready)

---

# 🏗 Архітектура

Проєкт побудований за такою архітектурою:

* **Controller layer** — REST API
* **Service layer** — бізнес-логіка
* **Repository layer** — Spring Data JPA
* **Security layer** — JWT + Cookie + Role-based access
* **Specification layer** — динамічна фільтрація
* **Simulation module** — логіка руху дронів

---

# 👥 Ролі доступу

## USER

* Створення замовлення
* Перегляд замовлень

## ADMIN

* Повне управління замовленнями
* Імпорт CSV
* Перегляд статистики
* Управління дронами
* Запуск доставки

---

# 🔐 Аутентифікація

Система використовує **JWT**, який зберігається в **HttpOnly cookie**.

### Особливості:

* Токен автоматично додається браузером до кожного запиту
* Не потрібно передавати `Authorization: Bearer`
* Захист від XSS (HttpOnly)
* Підтримка SameSite policy

---

# 📡 API Ендпоїнти

## 🔑 Auth

| Метод | Endpoint      | Опис        | Доступ |
|-------|---------------|-------------|--------|
| POST  | `/auth/login` | Авторизація | Public |

---

## 📦 Orders

| Метод  | Endpoint           | Опис                                     | Доступ |
|--------|--------------------|------------------------------------------|--------|
| GET    | `/orders`          | Список замовлень (фільтрація, пагінація) | ADMIN  |
| GET    | `/orders/{id}`     | Отримати замовлення                      | USER   |
| POST   | `/orders`          | Створити замовлення                      | USER   |
| PUT    | `/orders/{id}`     | Оновити замовлення                       | ADMIN  |
| DELETE | `/orders/{id}`     | Видалити замовлення                      | ADMIN  |
| GET    | `/orders/stats`    | Статистика                               | ADMIN  |
| POST   | `/orders/upload`   | CSV імпорт                               | ADMIN  |
| POST   | `/orders/pay/{id}` | заплатити за замовлення                  | USER   |

---

## 🚁 Drones

| Метод | Endpoint                    | Опис                | Доступ |
| ----- | --------------------------- | ------------------- | ------ |
| GET   | `/drones`                   | Список дронів       | ADMIN  |
| GET   | `/drones/{id}`              | Інформація про дрон | ADMIN  |
| POST  | `/delivery/start/{orderId}` | Запуск доставки     | ADMIN  |

---

# 🔎 Приклад фільтрації

```
GET /orders?orderStatus=ORDERED&kitType=STANDARD&page=0&size=20&sort=createdAt,desc
```

Підтримується:

* before
* after
* orderStatus
* email
* kitType
* sort
* page
* size

---

# 🛠 Технології

* Java 21
* Spring Boot 4
* Spring Security
* Spring Data JPA
* Hibernate 7
* PostgreSQL
* Docker
* Railway

---

# ⚙️ Змінні середовища

```
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=create (при першому запуску, далі validate)
JWT_SECRET=your_secret_key
COOKIE_SAME_SITE="None"
COOKIE_SECURE="true"
COOKIE_HTTP_ONLY="true"
COOKIE_PATH="/"
```

---

# 🐳 Docker

## Dockerfile

```dockerfile
FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
```

---

## Збірка

```
mvn clean package -DskipTests
docker build -t placeholder-drones .
```

---

## Запуск

```
docker run -p 8080:8080 \
-e SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/db \
-e SPRING_DATASOURCE_USERNAME=postgres \
-e SPRING_DATASOURCE_PASSWORD=password \
-e SPRING_JPA_HIBERNATE_DDL_AUTO=validate \
-e COOKIE_SAME_SITE="Lax" \
-e COOKIE_SECURE="false" \
-e COOKIE_HTTP_ONLY="true" \
-e COOKIE_PATH="/" \
-e JWT_SECRET=secret \
placeholder-drones
```

---

# 🌍 Доступ після запуску

```
http://localhost:8080
```

---

# 📊 Логіка руху дрона

Система симулює переміщення дрона:

1. Визначення точки доставки (latitude/longitude)
2. Рух до координати
3. Зміна статусу замовлення
4. Повернення на базу
5. Оновлення статусу дрона

Розрахунок податку залежить від географічного регіону доставки.

---

# 🚀 Деплой

Проєкт готовий до розгортання на:

* Railway
* Docker VPS
* Supabase PostgreSQL
* Будь-який хмарний сервіс із підтримкою Docker

---

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