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

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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
                        <Input
                            name="name"
                            placeholder="Full name"
                            required
                        />

                        <Input
                            name="email"
                            type="email"
                            placeholder="Email"
                            required
                        />

                        <Input
                            name="password"
                            type="password"
                            placeholder="Password"
                            required
                        />

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
