# HNU Clinic Health Record & Appointment System

A role-based health record and appointment platform built with Next.js for the Holy Name University (HNU) clinic. The system delivers a responsive public landing page, secure authentication, and dedicated dashboards for patients, doctors, nurses, and working scholars to manage appointments, medical records, and inventory in one place.

## ✨ Tech Stack at a Glance
<p align="center">
  <a href="https://nextjs.org" title="Next.js"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="Next.js" height="48"></a>
  <a href="https://vercel.com" title="Vercel"><img src="https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png" alt="Vercel" height="48"></a>
  <a href="https://www.typescriptlang.org" title="TypeScript"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" height="48"></a>
  <a href="https://tailwindcss.com" title="Tailwind CSS"><img src="https://github.com/devicons/devicon/blob/master/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" height="48"></a>
  <a href="https://ui.shadcn.com" title="shadcn/ui"><img src="https://avatars.githubusercontent.com/u/139895814?s=200&v=4" alt="shadcn/ui" height="48"></a>
  <a href="https://lucide.dev" title="Lucide Icons"><img src="https://avatars.githubusercontent.com/u/113062692?s=200&v=4" alt="Lucide" height="48"></a>
  <a href="https://next-auth.js.org" title="NextAuth"><img src="https://next-auth.js.org/img/logo/logo-sm.png" alt="NextAuth" height="48"></a>
  <a href="https://zod.dev" title="Zod"><img src="https://raw.githubusercontent.com/colinhacks/zod/master/logo.svg" alt="Zod" height="48"></a>
</p>

- **Next.js 15 (App Router) + React 19** orchestrate routing, server actions, streaming layouts, and client transitions throughout `src/app`.
- **Vercel-ready configuration** is optimized for deployment with `@vercel/speed-insights` hooked in `src/app/layout.tsx` for runtime analytics.
- **TypeScript-first codebase** (see `tsconfig.json`) covers UI, API handlers, and Prisma models for static safety.
- **Tailwind CSS v4** powers responsive styling, complemented by **shadcn/ui** components in `src/components/ui` for consistent theming and Radix-powered interactions.
- **Lucide React icons** provide the iconography across dashboards and shared components.
- **NextAuth Credentials provider** (configured in `src/lib/auth.ts`) manages secure role-aware authentication.
- **Zod schemas** validate API payloads, hardening endpoints such as `src/app/api/nurse/accounts/password/route.ts`.

## 🏥 Platform Overview
- **Public landing experience:** `src/app/page.tsx` serves a marketing page with contact form handling (`src/app/api/contact/route.ts`) and responsive navigation built on shadcn/ui primitives.
- **Authentication flow:** `src/app/login` hosts a multi-role credential sign-in backed by NextAuth’s session provider in `src/app/providers.tsx`, automatic toast notifications, and middleware enforcement (`src/middleware.ts`).
- **Role-specific dashboards:**
  - `src/app/patient` enables appointment booking (`appointments/page.tsx`), profile management, and visit tracking.
  - `src/app/doctor` centralizes consultation management, appointment queues, and account tools.
  - `src/app/nurse` covers clinic assignments, stock auditing (`inventory/page.tsx`), dispensing, records, and account administration.
  - `src/app/scholar` aggregates scholar tasks and account preferences.
- **Operational APIs:** the `src/app/api` tree encapsulates contact messaging, SMS notifications, password resets, appointment workflows, and meta lookups for clinics, doctors, and availability.
- **Shared foundations:** `src/lib` holds Prisma accessors, NextAuth configuration, email/SMS utilities, and helper functions reused in UI and API layers.

## 🔐 Authentication & Validation
- **NextAuth Credentials strategy** verifies users against Prisma via `authorize`, encodes role and status claims into JWT callbacks, and injects them into the session object for client-side gating (`src/lib/auth.ts`).
- **Global session handling** inside `src/app/providers.tsx` displays toast feedback, logs out deactivated accounts, and wraps the app with `<SessionProvider>`.
- **Zod-powered request guards** enforce payload integrity for sensitive endpoints (password updates, record mutations) ensuring consistent error messaging and avoiding malformed writes.

## 📊 Data & Persistence Layer
- `prisma/schema.prisma` models clinics, users, patients, employees, appointments, consultations, medication inventory, dispensing batches, and password reset tokens with referential actions that cascade or restrict deletes as needed.
- `prisma/migrations/` stores versioned SQL migrations. Run `npx prisma migrate dev` to apply schema changes locally.
- Database access is centralized through `src/lib/prisma.ts`, which reuses a singleton Prisma client outside production to avoid connection churn.

## 🎨 UI System
- Tailwind utility classes drive layout and typography (`src/app/globals.css`), while reusable shadcn/ui wrappers (e.g., `Button`, `Card`, `DropdownMenu`) live in `src/components/ui` for consistent theming.
- Lucide icons are lazily loaded when appropriate (`dynamic()` usage in `src/app/page.tsx`) to keep bundles slim while delivering accessible vector graphics.
- Layout-level fonts and analytics live in `src/app/layout.tsx`, composing Google Fonts via `next/font` and embedding Vercel Speed Insights.

## 🗂️ Directory Guide
```
src/
├─ app/                # App Router routes, role dashboards, and API endpoints
│  ├─ api/             # Route handlers for auth, appointments, notifications, and metadata
│  ├─ (role folders)   # Pages for patient, doctor, nurse, scholar, login, landing, about, etc.
│  ├─ layout.tsx       # Root metadata, fonts, analytics, and provider wrapper
│  └─ providers.tsx    # Global NextAuth + toast providers
├─ components/         # shadcn/ui-derived primitives and composite widgets
├─ hooks/              # Reusable React hooks for data fetching and UX helpers
├─ lib/                # Auth, Prisma, email, SMS, time utilities, and shared helpers
├─ types/              # Shared TypeScript enums and domain types
prisma/
├─ schema.prisma       # Data model definitions
└─ migrations/         # Generated SQL migrations per schema change
```

## 🔧 Environment Variables
| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma (`prisma/schema.prisma`). |
| `NEXTAUTH_SECRET` | Signing secret for NextAuth JWT/session cookies (`src/lib/auth.ts`, `src/middleware.ts`). |
| `EMAIL_USER`, `EMAIL_PASS` | SMTP credentials for contact emails (`src/app/api/contact/route.ts`, `src/lib/email.ts`). |
| `SEMAPHORE_API_KEY`, `SEMAPHORE_SENDER`, `SEMAPHORE_SENDER_NAME` | Semaphore SMS API credentials for notifications (`src/lib/sms.ts`, `src/app/api/auth/request-reset/route.ts`, `src/app/api/sms/send/route.ts`). |
| `NEXT_PUBLIC_APP_URL` | Public base URL used by nurse-side server actions (`src/app/nurse/actions.ts`). |
| `TZ` | Time-zone override (set to `Asia/Manila` in `next.config.ts`). |

Create a `.env` file with the variables above before running the app.

## 📦 NPM Scripts
| Script | Description 
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Run the built Next.js server in production mode. |
| `npm run lint` | Lint the project with ESLint. |

## 📤 Deployment Notes
- The project targets Vercel; analytics are already enabled through `@vercel/speed-insights` in the root layout.
- Prisma uses pooled connections. Ensure the production database connection string matches Vercel environment settings and consider [Accelerate](https://www.prisma.io/data-platform/accelerate) if deploying to serverless regions (supported via `@prisma/extension-accelerate`).
- Set environment variables in the hosting dashboard (Vercel or alternative) before promotion to production.
