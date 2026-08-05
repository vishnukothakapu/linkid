"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "../components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data: { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setMessage(
        "If an account exists with that email, a password reset link has been sent.",
      );

      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset email.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Forgot Password</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email address and we'll send you a password reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}

            {message && <p className="text-sm text-green-600">{message}</p>}

            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={loading}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
