# 🧪 Testing Guide (Jest + React Testing Library)

This document explains how to run, write, and extend the Jest test suite.

---

## Running Tests

```bash
# Run all Jest tests once
npm run test:jest

# Run in watch mode (re-runs on file save — ideal during development)
npm run test:jest:watch

# Run with coverage report (outputs to ./coverage/)
npm run test:jest:coverage

# Run BOTH test suites (tsx --test + Jest)
npm run test:all
```

---

## Test File Locations

```
__tests__/
├── lib/
│   ├── platforms.test.ts     ← Platform URL detection & validation
│   └── url.test.ts           ← URL helper utility functions
├── components/
│   └── Navbar.test.tsx       ← Navbar smoke + behaviour tests
└── middleware/
    └── csrf.test.ts          ← CSRF middleware tests
```

---

## Writing New Tests

### For a lib utility (`lib/foo.ts`)

Create `__tests__/lib/foo.test.ts`:

```ts
import { myFunction } from "@/lib/foo";

describe("myFunction()", () => {
  it("does the expected thing", () => {
    expect(myFunction("input")).toBe("expected output");
  });
});
```

### For a React component (`app/components/Bar.tsx`)

Create `__tests__/components/Bar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Bar from "@/app/components/Bar";

it("renders without crashing", () => {
  render(<Bar />);
  expect(screen.getByRole("navigation")).toBeInTheDocument();
});
```

### Global mocks available in every test

The following are mocked automatically via `jest.setup.ts`:

| Module | What's mocked |
|---|---|
| `next/navigation` | `useRouter`, `usePathname`, `useSearchParams` |
| `next-auth/react` | `useSession` (returns unauthenticated by default), `signIn`, `signOut` |
| `next/image` | Renders a plain `<img>` tag |

Override them per-test:

```ts
import { useSession } from "next-auth/react";
const mockUseSession = useSession as jest.Mock;

beforeEach(() => {
  mockUseSession.mockReturnValue({
    data: { user: { name: "Test User" } },
    status: "authenticated",
  });
});
```

---

## Coverage Thresholds

The project enforces **60% minimum coverage** on branches, functions, lines, and statements. If your PR drops below this, CI will fail. You can check locally:

```bash
npm run test:jest:coverage
```

---

## Conventions

- One test file per source file
- Use `describe()` to group related tests
- Use `it()` (not `test()`) for individual assertions
- Mock external dependencies — never hit real DBs or APIs in unit tests
- Follow the `// Arrange → Act → Assert` pattern in each `it()` block