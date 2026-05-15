# 🤝 Contributing to LinkID

Thank you for your interest in contributing to **LinkID**! We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and more.

Please take a few minutes to read this guide before opening an issue or submitting a pull request.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Branch Naming Conventions](#-branch-naming-conventions)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Issue Assignment Rules](#-issue-assignment-rules)
- [Open Source Programs (GSSoC/NSoC)](#-open-source-programs-gssocnsoc)
- [Development Workflow](#-development-workflow)
- [Code Style](#-code-style)
- [Testing](#-testing)

---

## 📜 Code of Conduct

This project adheres to a Contributor Code of Conduct. By participating, you agree to:

- **Be respectful** — Treat all contributors with kindness and professionalism
- **Be constructive** — Critique code, not people
- **Be inclusive** — We welcome contributors of all experience levels
- **Be patient** — Maintainers review PRs voluntarily; please allow 3–5 business days
- **No harassment** — Offensive language, personal attacks, or discrimination will not be tolerated

Violations can be reported to the maintainers via GitHub Issues (marked `[COC]`). Maintainers reserve the right to remove comments, close issues, and ban contributors who violate this policy.

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/linkid.git
cd linkid
```

### 2. Add Upstream Remote

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/linkid.git
git fetch upstream
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment

```bash
cp .env.example .env
```

Fill in your `.env` values. At minimum you need:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/linkid"
NEXTAUTH_SECRET="any-random-string-for-local-dev"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Set Up the Database

```bash
# Start PostgreSQL (or use Docker: docker-compose up -d)
npx prisma migrate dev
```

### 6. Run the Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you're ready to contribute! 🎉

---

## 📁 Project Structure

```
linkid/
├── app/               # Next.js App Router pages and API routes
│   ├── api/           # REST API handlers
│   ├── dashboard/     # Protected dashboard
│   ├── [username]/    # Dynamic public profile routes
├── components/ui/     # shadcn/ui components (do not modify directly)
├── lib/               # Shared utilities (auth, prisma, platforms)
├── prisma/            # Database schema and migrations
└── public/            # Static assets
```

**Key files to understand:**
- `lib/platforms.ts` — Platform detection and URL validation logic
- `lib/auth.ts` — NextAuth configuration
- `prisma/schema.prisma` — Database schema
- `middleware.ts` — Route protection

---

## 🌿 Branch Naming Conventions

All branches must follow this format:

```
<type>/<short-description>
```

| Type | When to use | Example |
|---|---|---|
| `feat/` | Adding a new feature | `feat/add-twitter-platform` |
| `fix/` | Fixing a bug | `fix/username-validation-regex` |
| `docs/` | Documentation only | `docs/update-api-readme` |
| `refactor/` | Code restructuring | `refactor/link-api-handler` |
| `chore/` | Tooling, deps, config | `chore/upgrade-prisma-v8` |
| `test/` | Adding/fixing tests | `test/platform-detection-unit` |
| `style/` | Formatting/CSS only | `style/fix-mobile-dashboard` |

> ❌ Avoid: `my-branch`, `fix`, `update`, `vishnu-stuff`

---

## ✍️ Commit Message Guidelines

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer: closes #issue-number]
```

### Types

| Type | Description |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no logic changes |
| `refactor` | Code changes without feature/fix |
| `test` | Adding or updating tests |
| `chore` | Maintenance, tooling, deps |
| `perf` | Performance improvements |

### Examples

```bash
# Good
feat(platforms): add Hashnode URL detection
fix(auth): redirect loop on protected pages for OAuth users
docs(readme): add Docker setup instructions
refactor(links-api): extract validation logic into helper

# Bad
updated stuff
fixed bug
WIP
```

### Rules

- Use **imperative mood**: `add`, `fix`, `update` — not `added`, `fixed`, `updated`
- Keep the subject line **under 72 characters**
- Reference issues in the footer: `Closes #42`
- Separate subject from body with a blank line

---

## 🔁 Pull Request Process

### Before Opening a PR

- [ ] Sync with upstream: `git fetch upstream && git merge upstream/main`
- [ ] Your branch is based on `main` (not another feature branch)
- [ ] Code follows the project's ESLint and TypeScript rules (`npm run lint`)
- [ ] The app builds without errors (`npm run build`)
- [ ] You've tested your changes manually in the browser
- [ ] You've added/updated documentation if needed

### PR Title Format

Follow the same Conventional Commits format:

```
feat(dashboard): add drag-and-drop link reordering
fix(api): handle duplicate platform gracefully
```

### PR Description Template

When you open a PR, fill in the template:

```markdown
## What does this PR do?
<!-- Clear description of the change -->

## Related Issue
Closes #<issue-number>

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactor

## How to Test
1. Go to...
2. Click on...
3. Verify that...

## Screenshots (if UI change)
<!-- Before / After screenshots -->

## Checklist
- [ ] Code follows project conventions
- [ ] Self-reviewed the changes
- [ ] No console.log left behind
- [ ] No new TypeScript errors
```

### Review Process

1. A maintainer will review your PR within **3–5 business days**
2. Address all requested changes in new commits (don't force-push during review)
3. Once approved, a maintainer will **squash and merge**
4. Delete your branch after merge

---

## 🎯 Issue Assignment Rules

### For Contributors

1. **Comment on the issue** saying you'd like to work on it — don't just start a PR
2. Wait for a maintainer to **officially assign** the issue to you
3. Once assigned, you have **7 days** to submit a PR; after that the issue is unassigned
4. If you need more time, comment on the issue before the deadline
5. **Don't work on multiple issues simultaneously** unless you've completed one

### For Issue Reporters

- Search for existing issues before opening a new one
- Use the provided issue templates
- Be as specific as possible — include screenshots, error messages, steps to reproduce
- Label issues appropriately (`bug`, `enhancement`, `documentation`, etc.)

### Labels

| Label | Meaning |
|---|---|
| `good first issue` | Great for new contributors |
| `help wanted` | Extra attention needed |
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `documentation` | Docs-only change |
| `duplicate` | Already reported |
| `wontfix` | Out of scope or intentional |
| `in progress` | Being actively worked on |

---

## 🌟 Open Source Programs (GSSoC/NSoC)

LinkID is proud to be part of **GirlScript Summer of Code 2026** and **Nexus Spring of Code 2026**.

### For Participants:

1. **Identify Yourself:** When commenting on an issue or opening a PR, clearly state which program you are part of (e.g., "I am a GSSoC'26 contributor").
2. **PR Tagging:** You **must** select your organization in the Pull Request template.
3. **Labels:** Maintainers will add `GSSoC-2026` or `NSoC-2026` labels to your PRs for tracking.
4. **Scoring:** Points will be awarded based on the difficulty and quality of the contribution, following each program's specific guidelines.

---

## 🔧 Development Workflow

### Running the App Locally

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (DB GUI)
```

### Database Workflow

```bash
# After changing schema.prisma:
npx prisma migrate dev --name "describe-your-change"
npx prisma generate

# Reset the database (WARNING: clears all data)
npx prisma migrate reset
```

### Adding a New Platform

1. Add the regex pattern to `lib/platforms.ts` in `PLATFORM_PATTERNS`
2. Add the icon to `lib/platformIcons.ts` in `PLATFORM_ICONS`
3. Test URL detection manually
4. Update the supported platforms table in `README.md`

---

## 🎨 Code Style

- **TypeScript strict mode** is enabled — no `any` unless absolutely necessary
- Use **named exports** for components, not default where possible (except page components)
- Keep API route handlers **thin** — move business logic to lib utilities
- Use `shadcn/ui` components from `components/ui/` for all UI primitives — don't reinvent
- CSS: use **Tailwind utility classes** only; avoid inline styles
- Avoid abbreviations in variable names: `usr` → `user`, `btn` → `button`

---

## 🧪 Testing

> Tests are coming soon! Track the issue: [#XX — Add test suite]

For now, **manual testing** is expected for all PRs:

- Test on both **desktop and mobile** viewport
- Test in both **light and dark mode**
- Test with an **authenticated** and **unauthenticated** user where relevant
- Test edge cases (empty states, long usernames, invalid URLs)

---

## 💬 Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/linkid/discussions) for general questions
- Tag `@yourusername` in issues for urgent clarification
- Don't DM maintainers — keep all project communication public

---

**Thank you for making LinkID better! 🚀**
