"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

interface DangerZoneCardProps {
  userEmail: string;
  hasPassword: boolean;
}

type Step = "confirm" | "password" | "otp";

export function DangerZoneCard({ userEmail, hasPassword }: DangerZoneCardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [deleteText, setDeleteText] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("confirm");
      setDeleteText("");
      setPassword("");
      setShowPassword(false);
      setOtp("");
      setOtpSent(false);
      setCooldown(0);
      setError("");
      setLoading(false);
      setOtpSending(false);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleNext = useCallback(() => {
    setError("");
    if (step === "confirm") {
      if (hasPassword) {
        setStep("password");
      } else {
        setStep("otp");
      }
    } else if (step === "password") {
      setStep("otp");
    }
  }, [step, hasPassword]);

  const sendOtp = useCallback(async () => {
    setOtpSending(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/user/send-delete-otp", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send verification code");
        return;
      }

      setOtpSent(true);
      setCooldown(60);
      toast.success(`Verification code sent to ${maskEmail(userEmail)}`);
    } catch {
      setError("Failed to send verification code");
    } finally {
      setOtpSending(false);
    }
  }, [userEmail]);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          ...(hasPassword && { password }),
          otp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete account");
        setLoading(false);
        return;
      }

      toast.success("Account deleted successfully. Goodbye!");
      await signOut({ callbackUrl: "/account-deleted" });
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }, [hasPassword, password, otp]);

  return (
    <>
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data including
            your links, connected accounts, and sessions. This action is{" "}
            <strong className="text-red-600 dark:text-red-400">
              irreversible
            </strong>
            .
          </p>

          <Button
            id="delete-account-btn"
            variant="destructive"
            onClick={() => setOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              {step === "confirm" &&
                "This will permanently delete your account and all your data. This action cannot be undone."}
              {step === "password" &&
                "Enter your password to verify your identity."}
              {step === "otp" &&
                `We'll send a verification code to ${maskEmail(userEmail)} to confirm this action.`}
            </DialogDescription>
          </DialogHeader>

          {/* Error display */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}
          {step === "confirm" && (
            <div className="space-y-3">
              <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200">
                ⚠️ All your links, sessions, and connected accounts will be{" "}
                <strong>permanently removed</strong>.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="delete-confirm-input">
                  Type <span className="font-mono font-bold text-red-600">DELETE</span>{" "}
                  to continue
                </Label>
                <Input
                  id="delete-confirm-input"
                  placeholder="Type DELETE"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-1.5">
              <Label htmlFor="delete-password-input">Password</Label>
              <div className="relative">
                <Input
                  id="delete-password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-3">
              {!otpSent ? (
                <Button
                  id="send-otp-btn"
                  variant="outline"
                  onClick={sendOtp}
                  disabled={otpSending}
                  className="w-full"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-otp-input">
                      Verification Code
                    </Label>
                    <Input
                      id="delete-otp-input"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="text-center text-lg tracking-widest"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={sendOtp}
                    disabled={cooldown > 0 || otpSending}
                    className="text-xs text-muted-foreground"
                  >
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend Code"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {step !== "confirm" && (
              <Button
                variant="ghost"
                onClick={() => {
                  setError("");
                  if (step === "otp" && hasPassword) setStep("password");
                  else if (step === "password") setStep("confirm");
                  else setStep("confirm");
                }}
                disabled={loading}
              >
                Back
              </Button>
            )}

            {step === "confirm" && (
              <Button
                id="confirm-next-btn"
                variant="destructive"
                onClick={handleNext}
                disabled={deleteText !== "DELETE"}
              >
                Next
              </Button>
            )}

            {step === "password" && (
              <Button
                id="password-next-btn"
                variant="destructive"
                onClick={handleNext}
                disabled={!password}
              >
                Next
              </Button>
            )}

            {step === "otp" && otpSent && (
              <Button
                id="delete-confirm-btn"
                variant="destructive"
                onClick={handleDelete}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete My Account"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}
