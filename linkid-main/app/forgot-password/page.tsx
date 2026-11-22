"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/app/components/Navbar";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        // Mock functionality for now as per #253
        setTimeout(() => {
            setLoading(false);
            toast.success("Password updated successfully!");
            router.push("/register"); // Redirect to Get Started page
        }, 1000);
    }

    return (
        <>
            <Navbar />
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
                <div className="w-full max-w-md space-y-3 rounded-xl border bg-background p-6 shadow-sm">
                    <div className="space-y-1 text-center">
                        <h1 className="text-2xl font-bold">Reset Password</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative flex items-center">
                            <Lock className="absolute left-3 text-muted-foreground" width="20" />
                            <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10 pr-10 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff width="20" /> : <Eye width="20" />}
                            </button>
                        </div>

                        <Button className="w-full" disabled={loading || !password.trim()} type="submit">
                            {loading ? "Saving..." : "Save and Continue"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground pt-4">
                        Remembered your password?{" "}
                        <Link href="/login" className="font-medium hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
