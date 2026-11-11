"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Navbar } from "../components/Navbar";
import { PLATFORMS } from "@/lib/constants";
import {
  TWO_FACTOR_INVALID_CODE_ERROR,
  TWO_FACTOR_REQUIRED_ERROR,
} from "@/lib/authErrors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const isEmailAndPasswordEmpty =
    !email.trim() || !password.trim();

  const isTwoFactorCodeValid =
    /^\d{6}$/.test(totpCode) ||
    /^[A-Z0-9]{10}$/.test(totpCode);

  async function handleLogin() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        email: trimmedEmail,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (response?.error === TWO_FACTOR_REQUIRED_ERROR) {
        setTwoFactorRequired(true);
        setError(null);
        return;
      }

      if (response?.error) {
        setError("Login failed. Check your email and password.");
        return;
      }

      if (response?.url) {
        window.location.href = response.url;
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit() {
    const trimmedCode = totpCode
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();

    if (
      !/^\d{6}$/.test(trimmedCode) &&
      !/^[A-Z0-9]{10}$/.test(trimmedCode)
    ) {
      setError(
        "Enter the 6-digit code from your authenticator app or your 10-character recovery code."
      );
      return;
    }

    setTwoFactorLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        email: email.trim(),
        password,
        totpCode: trimmedCode,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (response?.error === TWO_FACTOR_INVALID_CODE_ERROR) {
        setError(
          "Invalid code. Check your authenticator app or recovery code and try again."
        );
        setTotpCode("");
        return;
      }

      if (response?.error) {
        setError("Login failed. Check your email and password.");
        return;
      }

      if (response?.url) {
        window.location.href = response.url;
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    signIn(PLATFORMS.GOOGLE, {
      callbackUrl: "/dashboard",
    }).finally(() => {
      setGoogleLoading(false);
    });
  }

  function handleGithubLogin() {
    setGithubLoading(true);
    setError(null);

    signIn(PLATFORMS.GITHUB, {
      callbackUrl: "/dashboard",
    }).finally(() => {
      setGithubLoading(false);
    });
  }

  function backToCredentials() {
    setTwoFactorRequired(false);
    setTotpCode("");
    setError(null);
  }

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-24">
        <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>

            <p className="text-sm text-muted-foreground">
              Sign in to your LinkID account
            </p>
          </div>

          {/* OAuth Buttons */}
          {!twoFactorRequired && (
            <>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer"
                  disabled={googleLoading || githubLoading || loading}
                  onClick={handleGoogleLogin}
                >
                  {googleLoading ? (
                    <Spinner className="mr-2 h-5 w-5" />
                  ) : (
                    <FcGoogle className="mr-2 h-5 w-5" />
                  )}

                  {googleLoading
                    ? "Connecting..."
                    : "Continue with Google"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer"
                  disabled={googleLoading || githubLoading || loading}
                  onClick={handleGithubLogin}
                >
                  {githubLoading ? (
                    <Spinner className="mr-2 h-5 w-5" />
                  ) : (
                    <FaGithub className="mr-2 h-5 w-5" />
                  )}

                  {githubLoading
                    ? "Connecting..."
                    : "Continue with GitHub"}
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />

                <span className="text-xs text-muted-foreground">
                  OR
                </span>

                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {/* Two-Factor Authentication */}
          {twoFactorRequired ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleTwoFactorSubmit();
              }}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </span>

                <h2 className="text-lg font-semibold">
                  Two-Factor Authentication
                </h2>

                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                  or a recovery code to finish signing in.
                </p>
              </div>

              {error && (
                <p
                  className="text-sm text-red-500"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Code or recovery code"
                maxLength={10}
                value={totpCode}
                autoFocus
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase();

                  setTotpCode(value);
                  setError(null);
                }}
                className="text-center text-lg tracking-[0.5em]"
                aria-label="Two-factor authentication code"
              />

              <Button
                className="w-full"
                type="submit"
                disabled={
                  twoFactorLoading || !isTwoFactorCodeValid
                }
              >
                {twoFactorLoading ? "Verifying..." : "Verify"}
              </Button>

              <button
                type="button"
                onClick={backToCredentials}
                disabled={twoFactorLoading}
                className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground hover:underline disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
            </form>
          ) : (
            /* Email and Password Login */
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleLogin();
              }}
            >
              {error && (
                <p
                  className="text-sm text-red-500"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              {/* Email */}
              <Input
                type="email"
                placeholder="Email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                disabled={loading}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                className="h-11"
              />

              {/* Password */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                  }}
                  className="h-11 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                className="h-11 w-full font-medium"
                type="submit"
                disabled={loading || isEmailAndPasswordEmpty}
              >
                {loading ? "Logging in..." : "Login with Email"}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="font-medium hover:underline"
            >
              Signup
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
