<div align="center">


# 🔗 LinkID

### Your professional identity, simplified.

**One username. Clean, predictable links for every platform.**


[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](./CONTRIBUTING.md)
[![Stars](https://img.shields.io/github/stars/vishnukothakapu/linkid?style=flat-square)](https://github.com/vishnukothakapu/linkid/stargazers)

<br />

This project is part of **GirlScript Summer of Code
2026 (GSSoC'26)** and **Nexus Spring of Code 2026 (NSoC'26)**


[Live Demo](https://linkid.qzz.io) · [Docs](https://github.com/vishnukothakapu/linkid/wiki) · [Report Bug](https://github.com/vishnukothakapu/linkid/issues) · [Request Feature](https://github.com/vishnukothakapu/linkid/issues)

<br />

> **LinkID is built for developers and professionals.**  
> Stop pasting long URLs everywhere. Share clean, readable links like:  
> `linkid.qzz.io/username/github` · `linkid.qzz.io/username/linkedin`

</div>


## Features

### Core
- **Platform Routing** — Predictable links like `/github`, `/linkedin`, `/leetcode`, `/portfolio`
- **Single Professional Identity** — One username, all your platforms
-  **Auto Platform Detection** — Paste any URL and the platform is detected automatically
- **Public Profile Page** — Shareable profile at `linkid.qzz.io/username`
- **Real-time Dashboard** — Add, edit, and delete links instantly without a page reload

### Auth & Security
- **OAuth Login** — Google & GitHub sign-in via NextAuth.js
- **Email + Password Auth** — Traditional credential-based login with bcrypt hashing
- **Route Protection** — Middleware-based auth guards on dashboard and API routes

### UX & Design
- **Dark Mode** — Full system, light, and dark theme support via `next-themes`
- **Fully Responsive** — Mobile-first design with Tailwind CSS
- **Toast Notifications** — Instant feedback on all user actions
- **Platform Icons** — Automatic icon matching for 10+ platforms

### Developer Experience
- **Type-safe** — End-to-end TypeScript with strict mode
- **Prisma ORM** — Type-safe database access with PostgreSQL
- **URL Validation** — Strict per-platform URL validation before saving
- **Optimistic UI** — Local state updates before server confirmation

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Database** | [PostgreSQL](https://postgresql.org/) |
| **ORM** | [Prisma 7](https://prisma.io/) |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) + [React Icons](https://react-icons.github.io/react-icons/) |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Live Demo

> **Try it live:** [https://linkid.qzz.io](https://linkid.qzz.io)

**Example profile:** [linkid.qzz.io/vishnu](https://linkid.qzz.io/vishnu)  
**Platform redirect:** [linkid.qzz.io/vishnu/github](https://linkid.qzz.io/vishnu/github)

---

## Installation

### Prerequisites

- Node.js `>=20.9.0`
- PostgreSQL `>=14`
- npm / yarn / pnpm

### 1. Clone the Repository

```bash
git clone https://github.com/vishnukothakapu/linkid.git
cd linkid
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values. For local development, you can use a local PostgreSQL instance or the provided Docker setup.

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/linkid"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"          # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional but recommended for full testing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 3. Set Up the Database

```bash
# Run migrations to create tables
npx prisma migrate dev

# (Optional) Open Prisma Studio to inspect your data visually
npx prisma studio
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 OAuth Configuration Guide

To enable Google or GitHub login locally:

### Google Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Navigate to **APIs & Services > Credentials**.
4. Create an **OAuth 2.0 Client ID**.
5. Set Authorized Redirect URIs to: `http://localhost:3000/api/auth/callback/google`.

### GitHub Setup
1. Go to your GitHub **Settings > Developer settings > OAuth Apps**.
2. Click **New OAuth App**.
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`.

---

## 🛠️ Troubleshooting

- **Database Connection Error**: Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` matches your credentials.
- **NextAuth Secret**: If you see session errors, ensure `NEXTAUTH_SECRET` is set to a long random string.
- **Migration Issues**: If Prisma migrations fail, try `npx prisma migrate reset` (Note: this will wipe your local data).

---


## 📁 Folder Structure

```
linkid/
├── app/
│   ├── [username]/              # Public profile pages
│   │   ├── [platform]/          # Platform redirect handler
│   │   │   └── page.tsx
│   │   ├── page.tsx             # Public profile page
│   │   └── ProfileCard.tsx      # Profile UI components
│   ├── api/
│   │   ├── auth/                # NextAuth routes
│   │   ├── links/               # Link CRUD endpoints
│   │   │   └── [id]/            # Individual link operations
│   │   ├── profile/             # Profile update endpoints
│   │   └── username/            # Username check & creation
│   ├── components/              # Shared UI components
│   │   ├── DashboardNavbar.tsx
│   │   ├── Navbar.tsx
│   │   └── ThemeToggle.tsx
│   ├── dashboard/               # Protected dashboard pages
│   ├── login/                   # Authentication pages
│   ├── profile/                 # User profile settings
│   ├── register/
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   ├── platformIcons.ts         # Platform icon registry
│   ├── platforms.ts             # Platform detection & validation
│   ├── prisma.ts                # Prisma client singleton
│   └── url.ts                   # URL utilities
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
├── middleware.ts                # Auth middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Usage Guide

### Creating Your LinkID

1. Sign up at [linkid.qzz.io/register](https://linkid.qzz.io/register)
2. Pick your unique username (e.g., `vishnu`)
3. Paste your profile URLs — platform is detected automatically
4. Share `linkid.qzz.io/vishnu` everywhere

### Supported Platforms

| Platform | Route | Example |
|---|---|---|
| GitHub | `/github` | `linkid.qzz.io/vishnu/github` |
| LinkedIn | `/linkedin` | `linkid.qzz.io/vishnu/linkedin` |
| LeetCode | `/leetcode` | `linkid.qzz.io/vishnu/leetcode` |
| YouTube | `/youtube` | `linkid.qzz.io/vishnu/youtube` |
| X (Twitter) | `/x` | `linkid.qzz.io/vishnu/x` |
| Instagram | `/instagram` | `linkid.qzz.io/vishnu/instagram` |
| Facebook | `/facebook` | `linkid.qzz.io/vishnu/facebook` |
| Discord | `/discord` | `linkid.qzz.io/vishnu/discord` |
| Twitch | `/twitch` | `linkid.qzz.io/vishnu/twitch` |
| Custom Website | `/your-label` | `linkid.qzz.io/vishnu/blog` |

---

## 🤝 Contributing

We love contributions! LinkID is an open-source project and welcomes PRs of all sizes.

👉 **[Read the Contributing Guide →](./CONTRIBUTING.md)**

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/linkid.git
cd linkid

# Create a branch
git checkout -b feat/your-feature-name

# Make changes, then push
git push origin feat/your-feature-name

# Open a Pull Request on GitHub
```

## Roadmap / Open Issues

See [GitHub Issues](https://github.com/vishnukothakapu/linkid/issues) for 
tasks open to contributors.
---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — The React framework for production
- [shadcn/ui](https://ui.shadcn.com/) — Beautifully designed component library
- [Prisma](https://prisma.io/) — Next-generation ORM for Node.js
- [NextAuth.js](https://next-auth.js.org/) — Authentication for Next.js
- [Vercel](https://vercel.com/) — Platform for deploying Next.js apps

---

<div align="center">

Made with ❤️ by [Vishnu Kothakapu](https://github.com/vishnukothakapu) and [contributors](https://github.com/vishnukothakapu/linkid/graphs/contributors)

⭐ **Star this repo if you find it useful!**

</div>
