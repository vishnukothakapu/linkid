"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing verification token.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch(`/api/auth/verify?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setMessage("Your email has been successfully verified! You can now log in to your account.");
                } else {
                    setStatus("error");
                    setMessage(data.error || "Verification failed. The link may be expired or invalid.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("An unexpected error occurred. Please try again later.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <h1 className="text-2xl font-bold">Verifying...</h1>
                        <p className="text-muted-foreground">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <h1 className="text-2xl font-bold text-foreground">Email Verified!</h1>
                        <p className="text-muted-foreground">{message}</p>
                        <Button asChild className="w-full mt-4">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center space-y-4">
                        <XCircle className="h-16 w-16 text-destructive" />
                        <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
                        <p className="text-muted-foreground">{message}</p>
                        <div className="flex flex-col gap-2 w-full mt-4">
                            <Button asChild variant="outline">
                                <Link href="/register">Back to Signup</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/login">Go to Login</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
