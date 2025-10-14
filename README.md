# HNU Clinic Health Record & Appointment System

A role-based health record and appointment platform built with Next.js for the Holy Name University (HNU) clinic. The system delivers a responsive public landing page, secure authentication, and dedicated dashboards for patients, doctors, nurses, and working scholars to manage appointments, medical records, and inventory in one place.【F:src/app/page.tsx†L18-L126】【F:src/app/patient/page.tsx†L1-L120】【F:src/app/doctor/page.tsx†L1-L120】【F:src/app/nurse/page.tsx†L1-L123】【F:src/app/scholar/page.tsx†L1-L120】

## 🧰 Tech Stack
- **Next.js 15 (App Router) & React 19** for the full-stack application shell.【F:package.json†L6-L47】
- **TypeScript** across the codebase for type safety.【F:tsconfig.json†L1-L17】
- **Tailwind CSS 4** and shadcn/ui components for the design system.【F:package.json†L48-L79】【F:src/app/page.tsx†L51-L126】
- **Prisma ORM + PostgreSQL** for data modeling and persistence.【F:prisma/schema.prisma†L1-L122】
- **NextAuth** credential-based authentication with session management.【F:src/lib/auth.ts†L1-L120】
- **Nodemailer & Semaphore SMS** integrations for email and SMS outreach.【F:src/app/api/contact/route.ts†L1-L96】【F:src/lib/sms.ts†L1-L22

## 🌟 Key Features
- **👥 Role-specific dashboards**: dedicated navigation, shortcuts, and workflows for patients, doctors, nurses, and scholars to manage their tasks efficiently.【F:src/app/patient/page.tsx†L28-L119】【F:src/app/doctor/page.tsx†L26-L119】【F:src/app/nurse/page.tsx†L24-L124】【F:src/app/scholar/page.tsx†L24-L117】
- **📅 Appointment scheduling & availability checks**: patients can request visits that respect doctor availability, time conflicts, and clinic locations before creating bookings.【F:src/app/patient/appointments/page.tsx†L44-L463】【F:src/app/api/patient/appointments/route.ts†L1-L128】
- **🗂️ Health records & consultations**: medical staff can log consultations, generate certificates, and dispense medications tied to inventory batches.【F:src/app/nurse/records/page.tsx†L132-L537】【F:src/app/doctor/consultation/page.tsx†L55-L392】【F:prisma/schema.prisma†L122-L222】
- **💊 Inventory & dispensing management**: nurses track medicine stock, replenishments, and dispensing events across clinics with filtering and status tracking.【F:src/app/nurse/inventory/page.tsx†L71-L573】【F:prisma/schema.prisma†L123-L204】
- **🔐 Secure authentication**: credential-based sign-in, session persistence, and role-aware authorization built on NextAuth and Prisma.【F:src/lib/auth.ts†L35-L120】【F:src/middleware.ts†L1-L27】
- **✉️ Branded communications**: contact form emails and password reset flows deliver HTML-styled messages and optional SMS confirmations.【F:src/app/api/contact/route.ts†L1-L96】【F:src/app/api/auth/request-reset/route.ts†L64-L166】

## 🚀 Getting Started
1. **Clone & install**
   ```bash
   git clone <repository>
   cd hnu-clinic-app
   npm install
   ```
2. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```
3. **Apply migrations & seed data**
   ```bash
   npx prisma migrate dev
   ```
4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

   ## 🔑 Environment Variables
Create a `.env` file and supply the following values:

Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma.|【F:prisma/schema.prisma†L5-L12】
| `NEXTAUTH_SECRET` | Secret key for signing NextAuth JWTs and sessions.|【F:src/lib/auth.ts†L110-L120】
| `EMAIL_USER`, `EMAIL_PASS` | SMTP credentials for sending contact form and notification emails.|【F:src/app/api/contact/route.ts†L24-L78】
| `SEMAPHORE_API_KEY`, `SEMAPHORE_SENDER`, `SEMAPHORE_SENDER_NAME` | Credentials for Semaphore SMS notifications and password resets.|【F:src/lib/sms.ts†L1-L22】【F:src/app/api/auth/request-reset/route.ts†L121-L159】【F:src/app/api/sms/send/route.ts†L10-L36】
| `NEXT_PUBLIC_APP_URL` | Public base URL used by server actions when calling internal APIs (defaults to `http://localhost:3000`).|【F:src/app/nurse/actions.ts†L1-L43】


## 📁 Project Structure
```
src/
├─ app/                # App Router routes, role dashboards, and API handlers
├─ components/         # Reusable UI primitives and layout components
├─ hooks/              # Client-side hooks for data fetching and utilities
├─ lib/                # Auth, Prisma client, email/SMS helpers, and utilities
├─ types/              # Shared TypeScript declarations and enums
prisma/
├─ schema.prisma       # Data model definitions
└─ migrations/         # Versioned SQL migrations
```

## 📦 NPM Scripts
- `npm run dev` – start the development server.【F:package.json†L7-L16】
- `npm run build` – create an optimized production build.【F:package.json†L7-L16】
- `npm run start` – run the production server after building.【F:package.json†L7-L16】
- `npm run lint` – lint the project with ESLint.【F:package.json†L7-L16】

## 🧭 Additional Notes
- Prisma generates clients automatically after installing dependencies via the `postinstall` script (`prisma generate`).【F:package.json†L7-L16】
- Authentication-protected routes rely on NextAuth middleware; ensure cookies/domains are configured when deploying.【F:src/middleware.ts†L1-L27】
- Email and SMS integrations require valid credentials in production environments to avoid runtime failures.【F:src/app/api/contact/route.ts†L24-L78】【F:src/lib/sms.ts†L1-L22】