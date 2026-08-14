"use client";

import { useCallback, useState } from "react";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

type SetupStep = "loading" | "setup" | "recovery";

interface TwoFactorCardProps {
  enabled: boolean;
  hasPassword: boolean;
}

export function TwoFactorCard({ enabled, hasPassword }: TwoFactorCardProps) {
  const [open, setOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("loading");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesCopied, setCodesCopied] = useState(false);

  const [isEnabled, setIsEnabled] = useState(enabled);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDisableOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setPassword("");
      setShowPassword(false);
      setDisableCode("");
      setError("");
      setDisableLoading(false);
    }
  }, []);

  const handleSetupOpenChange = useCallback((next: boolean) => {
    setSetupOpen(next);
    if (!next) {
      setSetupStep("loading");
      setQrCodeUrl("");
      setSecret("");
      setVerifyCode("");
      setVerifyLoading(false);
      setRecoveryCodes([]);
      setCodesCopied(false);
      setError("");
    }
  }, []);

  const startSetup = useCallback(async () => {
    setSetupOpen(true);
    setSetupStep("loading");
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start setup. Please try again.");
        handleSetupOpenChange(false);
        return;
      }

      const data = await res.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setSetupStep("setup");
    } catch {
      toast.error("Failed to start setup. Please try again.");
      handleSetupOpenChange(false);
    }
  }, [handleSetupOpenChange]);

  const handleEnable = useCallback(async () => {
    const trimmedCode = verifyCode.replace(/\s+/g, "");

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setVerifyLoading(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/2fa/enable", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ code: trimmedCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to enable two-factor authentication.");
        return;
      }

      const data = await res.json();
      setRecoveryCodes(data.recoveryCodes || []);
      setSetupStep("recovery");
    } catch {
      setError("Failed to enable two-factor authentication.");
    } finally {
      setVerifyLoading(false);
    }
  }, [verifyCode]);

  const finishSetup = useCallback(() => {
    setIsEnabled(true);
    handleSetupOpenChange(false);
    toast.success("Two-factor authentication enabled");
  }, [handleSetupOpenChange]);

  const copyRecoveryCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
    } catch {
      toast.error("Failed to copy recovery codes.");
    }
  }, [recoveryCodes]);

  const handleDisable = useCallback(async () => {
    const trimmedCode = disableCode.replace(/\s+/g, "");

    if (!trimmedCode) {
      setError("Please enter your authenticator code or a recovery code.");
      return;
    }

    if (hasPassword && !password) {
      setError("Please enter your password.");
      return;
    }

    setDisableLoading(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          ...(hasPassword && { password }),
          code: trimmedCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to disable two-factor authentication.");
        return;
      }

      setIsEnabled(false);
      handleDisableOpenChange(false);
      toast.success("Two-factor authentication disabled");
    } catch {
      setError("Failed to disable two-factor authentication.");
    } finally {
      setDisableLoading(false);
    }
  }, [hasPassword, password, disableCode, handleDisableOpenChange]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "Two-factor authentication is active on your account. Every login with your email and password will also require a code from your authenticator app."
                : "Add an extra layer of security. You'll scan a QR code with an authenticator app and be asked for a 6-digit code on every login."}
            </p>

            <Badge
              variant={isEnabled ? "default" : "secondary"}
              className="shrink-0"
            >
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {isEnabled ? (
            <Button
              id="disable-2fa-btn"
              variant="outline"
              onClick={() => setOpen(true)}
              className="gap-2"
            >
              <ShieldOff className="h-4 w-4" />
              Disable 2FA
            </Button>
          ) : (
            <Button
              id="setup-2fa-btn"
              onClick={startSetup}
              className="gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              Set up 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup dialog */}
      <Dialog open={setupOpen} onOpenChange={handleSetupOpenChange}>
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={setupStep !== "loading"}
        >
          {setupStep === "loading" && (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Spinner className="h-6 w-6" />
              <p className="text-sm">Generating secure secret...</p>
            </div>
          )}

          {setupStep === "setup" && (
            <>
              <DialogHeader>
                <DialogTitle>Scan with your authenticator app</DialogTitle>
                <DialogDescription>
                  Scan the QR code below with Google Authenticator, Authy, or
                  any TOTP app. Then enter the 6-digit code to verify it works.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                {qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeUrl}
                    alt="Two-factor authentication QR code"
                    className="h-48 w-48 rounded-md border bg-white p-2"
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-md border">
                    <Spinner />
                  </div>
                )}

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Can&apos;t scan? Enter this code manually:
                  </p>
                  <p className="mt-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs tracking-wider">
                    {secret}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="2fa-verify-code">6-digit code</Label>
                <Input
                  id="2fa-verify-code"
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => {
                    setVerifyCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setError("");
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => handleSetupOpenChange(false)}
                  disabled={verifyLoading}
                >
                  Cancel
                </Button>
                <Button
                  id="enable-2fa-btn"
                  onClick={handleEnable}
                  disabled={verifyCode.length !== 6 || verifyLoading}
                >
                  {verifyLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & enable"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {setupStep === "recovery" && (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery codes</DialogTitle>
                <DialogDescription>
                  Two-factor authentication is now enabled. Keep these recovery
                  codes in a safe place. Each code can be used only once to log
                  in if you lose access to your authenticator app.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-md border bg-muted/40 p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {recoveryCodes.map((code) => (
                    <span key={code} className="tracking-wider">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={copyRecoveryCodes}>
                  {codesCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy codes
                    </>
                  )}
                </Button>
                <Button
                  id="finish-2fa-setup-btn"
                  onClick={finishSetup}
                >
                  I&apos;ve saved these codes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={open} onOpenChange={handleDisableOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={!disableLoading}>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Confirm your identity to turn off two-factor authentication.
              {hasPassword
                ? " Enter your password and a code from your authenticator app (or a recovery code)."
                : " Enter a code from your authenticator app (or a recovery code)."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="disable-2fa-password">Password</Label>
                <div className="relative">
                  <Input
                    id="disable-2fa-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    className="pr-10"
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

            <div className="space-y-1.5">
              <Label htmlFor="disable-2fa-code">
                Authenticator code or recovery code
              </Label>
              <Input
                id="disable-2fa-code"
                placeholder="123456 or XXXXXXXXXX"
                value={disableCode}
                onChange={(e) => {
                  setDisableCode(e.target.value.toUpperCase());
                  setError("");
                }}
                autoComplete="one-time-code"
                className="text-center text-lg tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => handleDisableOpenChange(false)}
              disabled={disableLoading}
            >
              Cancel
            </Button>
            <Button
              id="confirm-disable-2fa-btn"
              variant="destructive"
              onClick={handleDisable}
              disabled={disableLoading || !disableCode}
            >
              {disableLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
