"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
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
    const trimmedCode = totpCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (!/^\d{6}$/.test(trimmedCode) && !/^[A-Z0-9]{10}$/.test(trimmedCode)) {
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
        password: password,
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

  function backToCredentials() {
    setTwoFactorRequired(false);
    setTotpCode("");
    setError(null);
  }

  function isEmailAndPasswordEmpty() {
    return !email.trim().length || !password.trim().length;
  }

  function isTwoFactorCodeValid() {
    return /^\d{6}$/.test(totpCode) || /^[A-Z0-9]{10}$/.test(totpCode);
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
          {!twoFactorRequired && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full flex items-center justify-center gap-2 cursor-pointer"
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
          )}

          {/* DIVIDER */}
          {!twoFactorRequired && (
            <div className="flex items-center gap-2">
              <div className="h-px w-full bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px w-full bg-border" />
            </div>
          )}

          {/* TWO-FACTOR STEP */}
          {twoFactorRequired ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleTwoFactorSubmit();
              }}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </span>
                <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app or a
                  recovery code to finish signing in.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <Input
                type="text"
                autoComplete="one-time-code"
                placeholder="Code or recovery code"
                maxLength={11}
                value={totpCode}
                onChange={(e) => {
                  setTotpCode(
                    e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                  );
                  setError(null);
                }}
                className="text-center text-lg tracking-[0.5em]"
                autoFocus
              />

              <Button
                className="w-full"
                type="submit"
                disabled={twoFactorLoading || !isTwoFactorCodeValid()}
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
            <>
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
            </>
          )}

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
