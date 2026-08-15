import Link from "next/link";

type EmptyProfileStateProps = {
  isOwner: boolean;
};

export function EmptyProfileState({
  isOwner,
}: EmptyProfileStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-background dark:bg-zinc-900 px-8 py-14 text-center shadow-sm transition-all">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10 text-6xl shadow-inner"
        aria-hidden="true"
      >
        🔗
      </div>

      <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
        No links added yet
      </h2>

      <p className="mx-auto mt-3 max-w-md text-base leading-6 text-muted-foreground">
        This profile is waiting for its first professional link.
        Add your GitHub, LinkedIn, portfolio, resume, or social profiles
        to start building your online identity.
      </p>

      {isOwner && (
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-purple-700 hover:shadow-lg"
        >
          Add Your First Link
        </Link>
      )}

      <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        Your links are public and help others connect with you.
      </div>
    </div>
  );
}
