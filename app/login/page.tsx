"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  async function handleLogin() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail.length || !password.trim().length) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        email: trimmedEmail,
        password: password,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (response?.error) {
        setError("Login failed. Check your email and password.");
        return;
      }

      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function isEmailAndPasswordEmpty() {
    return !email.trim().length || !password.trim().length;
  }

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
              disabled={googleLoading || githubLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  await signIn("google", { callbackUrl: "/dashboard" });
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
              className="w-full flex items-center justify-center gap-2"
              disabled={googleLoading || githubLoading}
              onClick={async () => {
                setGithubLoading(true);
                try {
                  await signIn("github", { callbackUrl: "/dashboard" });
                } finally {
                  setGithubLoading(false);
                }
              }}
            >
              {githubLoading ? <Spinner className="h-5 w-5" /> : <FaGithub className="h-5 w-5" />}
              {githubLoading ? "Connecting..." : "Continue with GitHub"}
            </Button>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-2">
            <div className="h-px w-full bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px w-full bg-border" />
          </div>

          {/* FORM */}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Input
              type="email"
              placeholder="Email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
            />

            {/* PASSWORD WITH TOGGLE */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
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
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={loading || isEmailAndPasswordEmpty()}
            >
              {loading ? "Logging in..." : "Login with Email"}
            </Button>
          </form>

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
