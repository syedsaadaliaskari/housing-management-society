## Housing Society Management System

Final-year project built with **Next.js (App Router)**, **TypeScript**, and **PostgreSQL**.

---

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn

---

## 1. Clone and install

```bash
Open the code in editor

npm install
# or: yarn install
```

---

## 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://username:password@localhost:5432/societymanagement
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string
```

- Replace `username`, `password`, and host/port as needed.
- Generate `NEXTAUTH_SECRET` using any random string generator.

---

## 3. Set up the PostgreSQL database

1. Create the database:

```bash
createdb societymanagement
# or in psql:
# CREATE DATABASE zuvelio_inventory;
```

2. Apply the schema:

```bash
psql -d societymanagement -f schema.sql
```

3. (Optional) Insert initial data for `members`, `users`, etc., using SQL or a DB GUI.

---

## 4. Start the development server

```bash
npm run dev
# or: yarn dev
```

The app will be available at `http://localhost:3000`.

---

## 5. Login accounts

Admin / resident users are stored in the `users` table.

Passwords are stored as **SHA-256 hashes** (see `src/auth.ts`).

To create an admin user manually:

```sql
INSERT INTO members (first_name, email, phone_primary, ownership_status)
VALUES ('Admin', 'admin@example.com', '1234567890', 'OWNER')
RETURNING id;

-- Use the returned member id below and the SHA-256 hash of your password
INSERT INTO users (email, password_hash, role, member_id, is_active)
VALUES ('admin@example.com', '<sha256_password_hash>', 'ADMIN', <member_id>, TRUE);
```

Use that email/password on the `/login` page.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
