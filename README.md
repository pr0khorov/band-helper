# band-info

Веб-приложение для группы: репетиции, песни (с аккордами), сет-листы, идеи.

## Стек
- Backend: Java 11, Spring Boot 2.7, Spring Security (JWT, BCrypt), Spring Data JPA, H2 (file mode), Maven.
- Frontend: Angular 17 (standalone components), angular-calendar.

## Требования
- JDK 11+
- Maven 3.6+
- Node.js 18+ и npm

## Запуск backend
```
cd backend
mvn spring-boot:run
```
Сервер: http://localhost:8080
H2 console: http://localhost:8080/h2-console (jdbc URL: `jdbc:h2:file:./data/bandinfo`)

База данных хранится в `backend/data/bandinfo.mv.db`.

## Запуск frontend
```
cd frontend
npm install
npm start
```
UI: http://localhost:4200 (dev-proxy: `/api` → `http://localhost:8080`).

## Логин по умолчанию
При первом запуске создаётся пользователь:
- логин: `admin`
- пароль: `admin`
- роль: `ADMIN`

После первого входа смените пароль на странице **Админ → Пользователи**.

## Бэкап БД
На странице **Админ → Пользователи** (только для роли ADMIN):
- **Скачать бэкап** — сохраняет дамп `.sql` (выгрузка через H2 `SCRIPT TO`).
- **Загрузить бэкап** — выберите .sql файл. По умолчанию перед загрузкой БД очищается (`DROP ALL OBJECTS`), затем выполняется `RUNSCRIPT FROM`.

Файлы экспорта сохраняются в `backend/backups/`.

## Страницы
- **Репетиции** — календарь, события с временем и целями.
- **Песни** — title/author/bpm/tonality + моноширинный текст с аккордами.
- **Сет-листы** — произвольный моноширинный текст.
- **Идеи** — заметки (имя + текст).

Все авторизованные пользователи могут редактировать любые данные.
