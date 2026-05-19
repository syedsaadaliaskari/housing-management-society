# Housing Society Management System (HSMS)

A full-stack web application for managing residential housing societies — built as a Final Year Project using Next.js 16, TypeScript, PostgreSQL (Neon), and NextAuth v5.

## 🔗 Live Demo

[https://housing-management-s-git-f9faae-syed-saad-ali-askari-s-projects.vercel.app](https://housing-management-s-git-f9faae-syed-saad-ali-askari-s-projects.vercel.app)

![CI](https://github.com/syedsaadaliaskari/housing-management-society/actions/workflows/ci.yml/badge.svg)

**Admin login:**

- Email: `saadadmin@society.com`
- Password: `password`

**Resident login:**

- Email: `ahmed.khan@example.com`
- Password: `password`

---

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Language:** TypeScript
- **Database:** PostgreSQL hosted on Neon
- **Auth:** NextAuth v5 (JWT, bcrypt password hashing)
- **UI:** shadcn/ui, Tailwind CSS v4, Recharts
- **Payments:** Stripe (checkout sessions, server-side API routes)
- **CI/CD:** GitHub Actions + Vercel
- **Deployment:** Vercel

---

## ✨ Features

### Admin Panel

- **Dashboard** — real-time stats (members, units, complaints, alerts, outstanding dues) with area, bar, and pie charts
- **Members** — add and manage society members with ownership status
- **Units** — manage residential and commercial units with unit types
- **Ownerships** — track ownership history and transfers with purchase/sale prices
- **Billing** — generate maintenance and utility bills for units
- **Payments** — record and track payments against bills
- **Expenses** — log society expenses by category with payment mode tracking
- **Complaints** — view and update complaint status (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- **SOS Alerts** — acknowledge and resolve emergency alerts raised by residents
- **Notices** — publish announcements with priority and audience targeting
- **Polls** — create polls with options for resident voting
- **Vehicles** — register and manage resident vehicles
- **Reports** — income vs expense charts, defaulters list, financial summaries
- **Users** — manage user accounts, roles, and view payment history per user

### Resident Portal

- **Dashboard** — outstanding dues, open complaints, active alerts summary
- **Bills** — view pending bills and pay directly with method selection
- **Complaints** — submit and track complaint status
- **Notices** — view published society notices
- **Polls** — vote in active society polls
- **SOS** — trigger emergency alerts (Medical, Fire, Security)

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL or Neon account

### Setup

1. Clone the repository:

```bash
git clone https://github.com/syedsaadaliaskari/housing-management-society.git
cd housing-management-society
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Create `.env.local` file:

```env
DATABASE_URL=your_postgresql_connection_string
AUTH_SECRET=your_random_secret_key
AUTH_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

The system uses 21 PostgreSQL tables including:

`users` `members` `units` `unit_types` `unit_residents` `unit_ownerships` `bills` `payments` `complaints` `complaint_categories` `complaint_updates` `emergency_alerts` `notices` `polls` `poll_options` `poll_votes` `society_expenses` `expense_categories` `vehicles` `blocks` `member_family_members`

---

## 📁 Project Structure

src/
├── app/
│ ├── (auth)/ # Login and signup pages
│ ├── (main)/ # Admin pages
│ │ ├── billing/
│ │ ├── complaints/
│ │ ├── expenses/
│ │ ├── members/
│ │ ├── notices/
│ │ ├── ownerships/
│ │ ├── payments/
│ │ ├── polls/
│ │ ├── reports/
│ │ ├── sos/
│ │ ├── units/
│ │ └── vehicles/
│ ├── api/ # API routes
│ ├── resident/ # Resident portal
│ └── users/ # User management
├── components/ # Reusable UI components
└── lib/ # Database and utilities

---

## 🔐 Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT session strategy with encrypted tokens
- Role-based access control (ADMIN / RESIDENT)
- All API routes protected with session validation
- DB connection via SSL (Neon)

---

## 👨‍💻 Developer

**Syed Saad Ali Askari**
