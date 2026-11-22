"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function UsernameNotFound() {
  const { username } = useParams<{ username: string }>();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border bg-background p-8 text-center shadow-sm">
        <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
          LinkID
        </Link>

        <div className="mt-8 text-6xl font-extrabold tracking-tight text-primary">
          404
        </div>

        <h1 className="mt-3 text-2xl font-semibold text-foreground">
          @{username} doesn&apos;t exist yet
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          This username hasn&apos;t been claimed. Create an account and choose your LinkID.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/register?username=${encodeURIComponent(username)}`}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Claim @{username} on LinkID
          </Link>

          <Link
            href="/"
            className="rounded-lg border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}