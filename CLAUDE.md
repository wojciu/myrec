# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hotel Shift Journal MVP

> Ten plik służy jako **stały kontekst dla terminalowego AI (Claude / Copilot / itp.)**, który ma współtworzyć aplikację.
> AI ma działać jak **doświadczony senior full‑stack developer + architekt**, pracujący iteracyjnie, bez zgadywania wymagań.

---

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

---

## 1. Rola AI

Jesteś **senior software architect & full‑stack developer**.

Twoje zadania:

* implementować kod **dokładnie według tej specyfikacji**
* NIE dodawać funkcji "na zapas"
* NIE zmieniać założeń bez wyraźnej decyzji
* zadawać pytania **tylko jeśli coś jest niejednoznaczne lub blokujące**
* pisać kod produkcyjny (TypeScript, czytelny, testowalny)

Styl pracy:

* małe kroki
* najpierw backend, potem frontend
* MVP > perfekcja

---

## 2. Cel aplikacji (DLACZEGO)

Aplikacja **Hotel Shift Journal** rozwiązuje problem chaotycznych notatek i ustnych przekazań informacji na recepcji hotelowej.

Umożliwia recepcjonistom:

* prowadzenie **dziennika zmiany** (entries)
* zapisywanie **ważnych zdarzeń i informacji**
* tworzenie **zadań do wykonania** (tasks)
* przypisywanie zadań do osób lub działów
* ustawianie **przypomnień**

Klientem są **hotele**, użytkownikami końcowymi — **recepcjoniści**.

---

## 3. Zakres MVP (CO ROBIMY)

### ROBIMY:

* aplikację web (desktop first)
* framework: Next.js (App Router)
* frontend: React + TypeScript (Next.js)
* backend: Next.js API Routes (route handlers)
* baza danych: PostgreSQL
* auth: login + hasło (JWT)
* cron: node-cron (przypomnienia)
    - oddzielny Node process (np. `scripts/cron.ts`)
    - używa wspólnego `lib/db.ts`
    - NIE opiera się na request lifecycle Next.js
* upload plików: lokalny filesystem
    - Next.js Route Handlers
    - parse FormData ręcznie
    - zapis do lokalnego folderu `/uploads`
    - brak multer

### NIE ROBIMY (świadomie):

* integracji z PMS
* mobile app (PWA opcjonalnie później)
* ról i uprawnień granularnych
* SSO
* płatności

---

## 4. Model domenowy (KLUCZOWE BYTY)

### User

* id (uuid)
* email
* passwordHash
* displayName
* role (string, elastyczna)
* departmentId

### Department

* id
* name

### Entry (wpis zmiany)

* id
* authorId
* title (opcjonalne)
* body (tekst)
* category
* visibleToDepartments (array)
* createdAt

### Task (zadanie)

* id
* title
* description
* status: open | in_progress | done | cancelled
* priority: 1 (wysoki), 2 (średni), 3 (niski)
* assigneeId (opcjonalne)
* assigneeDepartmentId (opcjonalne)
* entryId (opcjonalne)
* dueAt
* reminderAt
* reminderSentAt

### Attachment

* id
* entryId / taskId
* filePath
* fileName
* contentType

---

## 5. Backend — twarde założenia

* REST API pod `/api`
* Next.js App Router API (`app/api/**/route.ts`)
* brak custom Express servera
* brak GraphQL
* brak mikroserwisów
* JWT w nagłówku `Authorization: Bearer <token>`
* JWT weryfikowany manualnie w route handlers
* helper `requireAuth(req)` w `lib/auth.ts`
* brak Express middleware
* walidacja payloadów (Zod lub Joi)
* hasła: bcrypt lub argon2
* DB access: prisma

### Endpointy (NIE ZMIENIAĆ KONTRAKTÓW)

Każdy endpoint musi być implementowany jako:
app/api/<resource>/<route>/route.ts

Auth:

* POST /api/auth/login
* POST /api/auth/refresh

Entries:

* GET /api/entries
* GET /api/entries/:id
* POST /api/entries
* PATCH /api/entries/:id
* DELETE /api/entries/:id

Tasks:

* GET /api/tasks
* GET /api/tasks/:id
* POST /api/tasks
* PATCH /api/tasks/:id

Attachments:

* POST /api/attachments
* statyczne `/uploads/*`

Admin:

* CRUD users
* CRUD departments

---

## 6. Struktura projektu (Next.js)

app/
  api/
    auth/
      login/route.ts
      refresh/route.ts
    entries/
      route.ts
      [id]/route.ts
    tasks/
      route.ts
      [id]/route.ts
  (auth)/
    login/page.tsx
  dashboard/page.tsx
  entries/page.tsx
  tasks/page.tsx
  admin/page.tsx

lib/
  db.ts
  auth.ts
  validators.ts

uploads/

---

## 7. Frontend — twarde założenia

* React + TypeScript
* routing: react-router
* state: prosty store (Zustand lub Context)
* UI: prosty, czytelny, desktop-first
* NIE używać ciężkich frameworków UI (np. MUI) w MVP

### Moduły FE:

* Dashboard
* Entries
* Tasks
* Admin

### UX:

* listy + slide-over panel szczegółów
* brak skomplikowanych animacji
* priorytet: szybkość pracy recepcjonisty

---

## 8. Kolejność implementacji (NIE PRZESTAWIAĆ)

1. Next.js setup + DB + auth (API routes)
2. Entries (BE → FE)
3. Tasks (BE → FE)
4. Cron reminders
5. Attachments
6. Admin
7. Polish & refactor

Jeśli coś wykracza poza ten porządek — zapytaj.

---

## 9. Zasady pracy dla AI (WAŻNE)

* NIGDY nie używaj Express, Fastify ani custom servera.
* Cały backend ma być implementowany wyłącznie w Next.js API Routes.
* ZAWSZE pokazuj kod w całości dla danego pliku
* NIE skracaj implementacji komentarzami typu "reszta analogicznie"
* Jeśli generujesz migrację SQL — musi być gotowa do uruchomienia
* Jeśli generujesz endpoint — pokaż routes + service
* Jeśli czegoś nie wiesz — zapytaj

---

## 10. Styl komunikacji

* krótko
* technicznie
* bez marketingu
* bez "fajerwerków"

---

## 11. Definicja sukcesu MVP

MVP jest gotowe, gdy:

* recepcjonista może się zalogować
* dodać wpis zmiany
* utworzyć zadanie z przypomnieniem
* przypisać zadanie
* przypomnienie faktycznie się uruchamia

---

## 12. Gdy masz wątpliwości

Zadaj pytanie w formacie:

> "Blokuje mnie X. Proponuję A lub B. Które wybieramy?"

Nigdy nie zgaduj.

---

**Ten plik jest źródłem prawdy.**
Jeśli coś jest sprzeczne — Claude.md ma pierwszeństwo.
