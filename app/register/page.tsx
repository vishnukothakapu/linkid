"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "../components/Navbar";

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const data = {
            name: (form.elements.namedItem("name") as HTMLInputElement).value,
            email: (form.elements.namedItem("email") as HTMLInputElement).value,
            password: (form.elements.namedItem("password") as HTMLInputElement).value,
        };

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        setLoading(false);

        if (res.ok) {
            router.push("/login");
        } else {
            alert("Registration failed");
        }
    }

    return (
        <>
            <Navbar />

            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
                <div className="w-full max-w-md space-y-3 rounded-xl border bg-background p-6 shadow-sm">
                    {/* HEADER */}
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold">Create your account</h1>
                        <p className="text-sm text-muted-foreground">
                            Start building your LinkID
                        </p>
                    </div>
                    {/* OAUTH SIGNUP */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        >
                            <FcGoogle className="h-5 w-5" />
                            Continue with Google
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
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


                    {/* EMAIL SIGNUP */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                name="name"
                                placeholder="Full name"
                                className="pl-10"
                                required
                            />
                        </div>
                        
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                name="email"
                                type="email"
                                placeholder="Email"
                                className="pl-10"
                                required
                            />
                        </div>
                        
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="pl-10 pr-10"
                                required
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

                        <Button className="w-full" disabled={loading}>
                            {loading ? "Creating account..." : "Signup with Email"}
                        </Button>
                    </form>
                   
                    
                   
                    {/* FOOTER */}
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
