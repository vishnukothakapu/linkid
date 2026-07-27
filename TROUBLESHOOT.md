# Troubleshooting

This guide covers common setup, installation, database, authentication, and runtime issues you may encounter while developing **LinkID**.

---

# Table of Contents

- Installation Issues
- Environment Variable Problems
- Database Issues
- Prisma Migration Issues
- OAuth Authentication Issues
- NextAuth Issues
- Development Server Issues
- Build Errors
- Docker Issues
- Port Already in Use
- Common TypeScript Errors
- Frequently Asked Questions

---

# Installation Issues

## npm install fails

### Possible Causes

- Unsupported Node.js version
- Corrupted node_modules
- Corrupted package-lock.json

### Solution

Verify your Node.js version:

```bash
node -v
```

Minimum supported version:

```
>=20.9.0
```

Clean dependencies and reinstall:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

# Environment Variable Problems

## Database connection fails

Error example:

```
PrismaClientInitializationError
```

### Solution

Verify your `.env` contains a valid PostgreSQL connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/linkid"
```

Check PostgreSQL is running.

---

## NEXTAUTH_SECRET missing

Error:

```
NEXTAUTH_SECRET is not set
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

Then update:

```env
NEXTAUTH_SECRET="your-generated-secret"
```

---

## NEXTAUTH_URL incorrect

For local development:

```env
NEXTAUTH_URL="http://localhost:3000"
```

For production:

```env
NEXTAUTH_URL="https://your-domain.com"
```

---

# Database Issues

## Prisma cannot connect

Possible causes:

- PostgreSQL not running
- Wrong credentials
- Wrong database name

Verify PostgreSQL is active.

Test your connection using:

```bash
npx prisma db pull
```

---

## Database doesn't exist

Create the database before running migrations.

Example:

```sql
CREATE DATABASE linkid;
```

Then run:

```bash
npx prisma migrate dev
```

---

# Prisma Migration Issues

## Migration failed

Run:

```bash
npx prisma migrate dev
```

If migration history becomes inconsistent:

```bash
npx prisma migrate resolve --applied <migration_name>
```

Replace:

```
<migration_name>
```

with the appropriate migration folder.

---

## Prisma Client out of sync

Regenerate Prisma Client:

```bash
npx prisma generate
```

---

## View database contents

Launch Prisma Studio:

```bash
npx prisma studio
```

---

# OAuth Authentication Issues

## Google login not working

Verify:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Ensure your OAuth redirect URI matches:

```
http://localhost:3000/api/auth/callback/google
```

---

## GitHub login fails

Verify:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Ensure the callback URL is:

```
http://localhost:3000/api/auth/callback/github
```

---

# NextAuth Issues

## Session is always null

Verify:

- NEXTAUTH_SECRET
- NEXTAUTH_URL

Restart the server after changing environment variables.

---

## Redirect loop after login

Possible causes:

- Wrong callback URL
- Incorrect NEXTAUTH_URL

Restart:

```bash
npm run dev
```

after updating `.env`.

---

# Development Server Issues

## npm run dev crashes

Check for TypeScript errors:

```bash
npm run lint
```

Then restart:

```bash
npm run dev
```

---

## Changes are not reflected

Delete the Next.js cache:

```bash
rm -rf .next
```

Restart:

```bash
npm run dev
```

---

# Build Errors

## Production build fails

Run:

```bash
npm run build
```

Common causes:

- TypeScript errors
- Missing environment variables
- Prisma schema mismatch

Check the error message carefully before rebuilding.

---

# Docker Issues

## PostgreSQL container not running

Start Docker services:

```bash
docker-compose up -d
```

Then run:

```bash
npx prisma migrate dev
```

Finally:

```bash
npm run dev
```

---

# Port Already in Use

If port **3000** is already occupied:

Linux/macOS:

```bash
lsof -i :3000
kill -9 <PID>
```

Windows:

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

# Common TypeScript Errors

## Cannot find module

Run:

```bash
npm install
```

Then:

```bash
npm run lint
```

---

## Prisma types missing

Run:

```bash
npx prisma generate
```

---

## Build passes but editor still shows errors

Restart the TypeScript server inside VS Code:

```
Ctrl + Shift + P

Type:

TypeScript: Restart TS Server
```

---

# Frequently Asked Questions

## Which Node.js version should I use?

```
20.9.0 or newer
```

---

## Which database is supported?

PostgreSQL

---

## How do I inspect my database?

```bash
npx prisma studio
```

---

## How do I reset dependencies?

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## How do I reset Prisma?

```bash
npx prisma migrate reset
```

**Warning:** This deletes all database data.

---

## Where should environment variables be stored?

Create a local `.env` file from:

```bash
cp .env.example .env
```

Never commit your `.env` file to version control.

---

# Still Need Help?

If the issue persists:

1. Verify your Node.js version.
2. Confirm PostgreSQL is running.
3. Check your `.env` configuration.
4. Ensure Prisma migrations have been applied.
5. Run:

```bash
npm run lint
```

6. Search existing GitHub Issues before opening a new one.