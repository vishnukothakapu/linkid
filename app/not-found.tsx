import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, UserPlus } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-md rounded-3xl border bg-background p-10 text-center shadow-xl shadow-violet-500/5 dark:shadow-none">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600">
           <span className="text-4xl font-black">404</span>
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved to another URL.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1 rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-700 shadow-md shadow-violet-500/20">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1 rounded-xl font-semibold">
            <Link href="/register" className="flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" />
              Register
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Think this is a mistake? <Link href="/" className="underline hover:text-violet-600">Contact support</Link>
        </p>
      </div>
    </main>
  );
}

