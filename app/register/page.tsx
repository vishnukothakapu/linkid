"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getCsrfToken } from "@/lib/csrfClient";
import { useCsrf } from "@/lib/useCsrf";
import { PLATFORMS } from "@/lib/constants";
import { getPasswordError } from "@/lib/validations/auth";

import { Navbar } from "../components/Navbar";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const csrfToken = useCsrf();

    const [googleLoading, setGoogleLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);

    const error = getPasswordError(password);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSubmitError(null);

        const form = e.currentTarget;
        const requestCsrfToken = csrfToken || await getCsrfToken();
        const data = {
            _csrf: requestCsrfToken,
            email: (form.elements.namedItem("email") as HTMLInputElement).value,
            name: (form.elements.namedItem("name") as HTMLInputElement).value,
            password: (form.elements.namedItem("password") as HTMLInputElement).value,
        };

        const passErr = getPasswordError(data.password);
        if (passErr) {
            setSubmitError(passErr);
            setLoading(false);
            return;
        }

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": requestCsrfToken,
            },
            body: JSON.stringify(data),
        });

        setLoading(false);

        if (res.ok) {
            router.push("/login");
        } else {
            const data = await res.json().catch(() => null) as { error?: string } | null;
            setSubmitError(data?.error ?? "Registration failed");
        }
    }

    return (
        <>
            <Navbar />

            <div className="flex min-h-screen items-center justify-center px-4 py-24 bg-muted/20">
                <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
                        <p className="text-sm text-muted-foreground">
                            Start building your LinkID
                        </p>
                    </div>

                    <div className="space-y-2">
                        {submitError && (
                            <p className="text-sm text-red-500" role="alert">
                                {submitError}
                            </p>
                        )}

                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 cursor-pointer h-11"
                            disabled={googleLoading || githubLoading}
                            onClick={async () => {
                                setGoogleLoading(true);
                                try {
                                    await signIn(PLATFORMS.GOOGLE, { callbackUrl: "/dashboard" });
                                } finally {
                                    setGoogleLoading(false);
                                }
                            }}
                        >
                            {googleLoading ? <Spinner className="h-5 w-5" /> : <FcGoogle className="h-5 w-5" />}
                            {googleLoading ? "Connecting..." : "Continue with Google"}
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 cursor-pointer h-11"
                            disabled={googleLoading || githubLoading}
                            onClick={async () => {
                                setGithubLoading(true);
                                try {
                                    await signIn(PLATFORMS.GITHUB, { callbackUrl: "/dashboard" });
                                } finally {
                                    setGithubLoading(false);
                                }
                            }}
                        >

                            {githubLoading ? <Spinner className="h-5 w-5" /> : <FaGithub className="h-5 w-5" />}
                            {githubLoading ? "Connecting..." : "Continue with GitHub"}

                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-px w-full bg-border" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="h-px w-full bg-border" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" name="_csrf" value={csrfToken} />

                        <div className="relative flex items-center">
                            <User className="absolute left-3 text-muted-foreground" size={20} />
                            <Input
                                name="name"
                                placeholder="Full name"
                                autoComplete="name"
                                required
                                className="pl-10 transition-colors h-11"
                            />
                        </div>

                        <div className="relative flex items-center">
                            <Mail className="absolute left-3 text-muted-foreground" width="20" />
                            <Input
                                name="email"
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                required
                                className="pl-10 transition-colors h-11"
                            />
                        </div>

                        <div className="relative flex items-center">
                            <Lock className="absolute left-3 text-muted-foreground" width="20" />
                            <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`pl-10 pr-10 transition-colors h-11 ${password && error ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30" : ""}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground top-1/2 -translate-y-1/2"
                            >
                                {showPassword ? <EyeOff width="20" /> : <Eye width="20" />}
                            </button>
                        </div>

                        {password && error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <Button className="w-full h-11 font-medium" disabled={loading} type="submit">
                            {loading ? "Creating account..." : "Signup with Email"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
