"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function AccountDeletedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace("/");
    }
  }, [countdown, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Account Deleted Successfully
          </h1>
          <p className="text-muted-foreground">
            Your account and all associated data have been permanently removed.
            We&apos;re sorry to see you go.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Redirecting to the home page in{" "}
            <span className="font-semibold text-foreground">{countdown}</span>{" "}
            second{countdown !== 1 ? "s" : ""}...
          </p>
        </div>

        <button
          onClick={() => router.replace("/")}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Go to home page now
        </button>
      </div>
    </main>
  );
}
