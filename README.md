# 🔗 LinkID  
### Your professional identity, simplified.

LinkID lets you share **clean, predictable, platform-specific links** using a single username.

Stop pasting long URLs everywhere.  
Share links like:

https://linkid.qzz.io/username/github  
https://linkid.qzz.io/username/linkedin  
https://linkid.qzz.io/username/portfolio  

Perfect for resumes, forms, and professional workflows.

---

## What is LinkID?

LinkID is a **professional link router**.

You create one username.  
You map it to your platforms.  
You share short, readable URLs that never change.

Update links anytime — your public URLs stay the same.

---

## Features

- **Single professional identity**  
  One username for all your platforms

- **Platform-specific routing**  
  `/github`, `/linkedin`, `/leetcode`, `/portfolio`, `/youtube`, etc.

- **Auto platform detection**  
  Paste a URL → platform detected automatically

- **Dashboard**  
  Add, edit, and delete links instantly

- **Public profile page**  
  https://linkid.qzz.io/username

- **Dark mode**  
  Fully supported

- **Resume-friendly URLs**  
  Clean, readable, professional

---

## Why LinkID?

Most “link-in-bio” tools are built for creators.

**LinkID is built for developers and professionals.**

No clutter.  
No gimmicks.  
Just identity → routing → clarity.

---

## Example

Instead of sharing:

https://www.linkedin.com/in/some-long-username-928374/

You share:

https://linkid.qzz.io/vishnu/linkedin

Clean. Predictable. Professional.

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- NextAuth
- Prisma
- PostgreSQL
- Tailwind CSS
- shadcn/ui

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/linkid
cd linkid
npm install
```

### 2. Environment variables

Create a .env file in the root directory:

```DATABASE_URL=postgresql://username:password@localhost:5432/linkid
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database setup

```
npx prisma migrate dev
```

### 4. Run the app

```
npm run dev
```

## Project Status

Actively under development.
