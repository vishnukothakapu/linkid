"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Navbar />

            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
                <div className="w-full max-w-md space-y-3 rounded-xl border bg-background p-6 shadow-sm">
                    {/* HEADER */}
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">
                            Login to your LinkID
                        </p>
                    </div>

                    {/* OAUTH */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => signIn("google")}
                        >
                            <FcGoogle className="h-5 w-5" />
                            Continue with Google
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => signIn("github")}
                        >
                            <FaGithub className="h-5 w-5" />
                            Continue with GitHub
                        </Button>
                    </div>

                    {/* DIVIDER */}
                    <div className="flex items-center gap-2">
                        <div className="h-px w-full bg-border" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <div className="h-px w-full bg-border" />
                    </div>

                    {/* FORM */}
                    <div className="space-y-3">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        {/* PASSWORD WITH TOGGLE */}
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <Link
                                href="#"
                                className="text-sm text-muted-foreground hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            className="w-full"
                            onClick={() =>
                                signIn("credentials", {
                                    email,
                                    password,
                                    callbackUrl: "/dashboard",
                                })
                            }
                        >
                            Login with Email
                        </Button>
                    </div>

                    {/* FOOTER */}
                    <p className="text-center text-sm text-muted-foreground">
                        Don’t have an account?{" "}
                        <Link href="/register" className="font-medium hover:underline">
                            Signup
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
