# Indus — Assignment Management System

A full-stack web app for teachers and students to manage assignments. Built with **Next.js 15**, **Prisma**, **PostgreSQL**, **Better Auth**, and **UploadThing**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Better Auth |
| File Upload | UploadThing |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| Deployment | Vercel |

---

## Features

- **Role-based auth** — separate Teacher and Student flows
- **Teacher dashboard** — create tasks, view submissions per task, delete tasks
- **Student dashboard** — view all assignments, track submission status
- **File uploads** — upload PDFs, Word docs, and images via UploadThing
- **Submission tracking** — see who submitted, when, file names, and notes
- **Protected routes** — middleware guards all dashboard routes

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd indus
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/indus_db"

# Better Auth — generate with: openssl rand -hex 32
BETTER_AUTH_SECRET="your-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"

# UploadThing — get from https://uploadthing.com/dashboard
UPLOADTHING_TOKEN="your-uploadthing-token"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with demo data (optional)
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Teacher | teacher@indus.edu | password123 |
| Student | student1@indus.edu | password123 |
| Student | student2@indus.edu | password123 |

> **Note:** Better Auth handles password hashing. The seed file creates users without passwords — use the sign-up page to register real accounts, or update the seed to use Better Auth's `auth.api.signUpEmail()`.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── teacher/      # Teacher views
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── tasks/             # Task list + new task form
│   │   │   └── submissions/       # View submissions per task
│   │   └── student/      # Student views
│   │       ├── page.tsx           # Dashboard
│   │       └── tasks/[taskId]/    # Task detail + submit form
│   ├── api/
│   │   ├── auth/[...all]/ # Better Auth handler
│   │   ├── tasks/         # CRUD for tasks
│   │   ├── submissions/   # Create submissions
│   │   └── uploadthing/   # UploadThing handler
│   ├── page.tsx           # Landing page
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx
│   ├── forms/
│   │   ├── CreateTaskForm.tsx
│   │   ├── SubmitTaskForm.tsx
│   │   └── DeleteTaskButton.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       └── uploadthing.ts
├── lib/
│   ├── auth.ts           # Better Auth server config
│   ├── auth-client.ts    # Better Auth client
│   ├── prisma.ts         # Prisma singleton
│   ├── uploadthing.ts    # UploadThing file router
│   ├── utils.ts          # Helpers (cn, formatDate, etc.)
│   └── validations.ts    # Zod schemas
├── middleware.ts          # Auth + role-based route protection
prisma/
├── schema.prisma
└── seed.ts
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Set `DATABASE_URL` to a production PostgreSQL URL (e.g. Neon, Supabase, Railway)
5. Deploy — Vercel auto-runs `next build`

### Recommended DB providers
- [Neon](https://neon.tech) — free serverless PostgreSQL
- [Supabase](https://supabase.com) — free tier with extras
- [Railway](https://railway.app) — easy provisioning

---

## Future Improvements

- Grading system (mark submissions as graded, add scores)
- Email notifications for new tasks and submissions
- File preview in-browser
- Class/group management
- Assignment comments thread
- Mobile-optimised responsive layout
- Real-time submission updates (Pusher / Supabase Realtime)
