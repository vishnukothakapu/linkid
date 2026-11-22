import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-primary"
        >
          LinkID
        </Link>

        <div className="mt-8 text-6xl font-extrabold tracking-tight text-primary">
          404
        </div>

        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          Page not found
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Sorry, the page you are looking for does not exist.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
