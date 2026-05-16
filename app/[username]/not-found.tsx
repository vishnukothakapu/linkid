import Link from "next/link";

export default function UsernameNotFound() {
  return (
    <main className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-md rounded-2xl border bg-background p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">404 Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Opps! The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}

