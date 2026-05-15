"use client";

import { useState } from "react";
import { KeyRound, Link2, LogOut, Copy } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getCsrfToken } from "@/lib/csrfClient";

type MergeResult = {
    success?: boolean;
    code?: string;
    expiresAt?: string;
    mergedLinks?: number;
    mergedAccounts?: number;
    transferredSessions?: number;
    conflicts?: string[];
    error?: string;
};

export function ProfileActionsCard({ hasPassword }: { hasPassword: boolean }) {
    const [generateOpen, setGenerateOpen] = useState(false);
    const [mergeOpen, setMergeOpen] = useState(false);
    const [generatePassword, setGeneratePassword] = useState("");
    const [mergePassword, setMergePassword] = useState("");
    const [mergeCode, setMergeCode] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mergeSummary, setMergeSummary] = useState<MergeResult | null>(null);

    async function handleGenerateCode() {
        setLoading(true);
        setMergeSummary(null);

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile/merge/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ password: hasPassword ? generatePassword : undefined }),
            });

            const data = (await response.json().catch(() => null)) as MergeResult | null;

            if (!response.ok) {
                toast.error(data?.error ?? "Unable to generate merge code");
                return;
            }

            setGeneratedCode(data?.code ?? "");
            setExpiresAt(data?.expiresAt ?? null);
            toast.success("Merge code generated");
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteMerge() {
        setLoading(true);
        setMergeSummary(null);

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile/merge/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({
                    code: mergeCode,
                    password: hasPassword ? mergePassword : undefined,
                }),
            });

            const data = (await response.json().catch(() => null)) as MergeResult | null;

            if (!response.ok) {
                toast.error(data?.error ?? "Unable to complete merge");
                return;
            }

            setMergeSummary(data ?? { success: true });
            toast.success("Accounts merged successfully");
            setMergeOpen(false);
        } finally {
            setLoading(false);
        }
    }

    async function copyCode() {
        if (!generatedCode) return;
        await navigator.clipboard.writeText(generatedCode);
        toast.success("Merge code copied");
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setGenerateOpen(true)}
                    >
                        <KeyRound className="h-4 w-4" />
                        Generate Merge Code
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setMergeOpen(true)}
                    >
                        <Link2 className="h-4 w-4" />
                        Merge Using Code
                    </Button>

                    <form
                        action="/api/auth/signout"
                        method="post"
                        className="w-full sm:w-auto"
                    >
                        <Button
                            variant="destructive"
                            type="submit"
                            className="w-full"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </form>

                    {mergeSummary?.success && (
                        <div className="w-full rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                            Merge complete: {mergeSummary.mergedLinks ?? 0} links, {mergeSummary.mergedAccounts ?? 0} connected accounts, and {mergeSummary.transferredSessions ?? 0} sessions were moved.
                            {mergeSummary.conflicts?.length ? (
                                <span className="block mt-1 text-amber-700">
                                    Conflicts were renamed: {mergeSummary.conflicts.join(", ")}.
                                </span>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate merge code</DialogTitle>
                        <DialogDescription>
                            Generate this on the account you want to keep. Then sign in to the other account and paste the code there.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {hasPassword && (
                            <Input
                                type="password"
                                placeholder="Confirm your password"
                                value={generatePassword}
                                onChange={(e) => setGeneratePassword(e.target.value)}
                            />
                        )}

                        {generatedCode && (
                            <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium">Your merge code</p>
                                        <p className="text-xs text-muted-foreground">
                                            Expires {expiresAt ? new Date(expiresAt).toLocaleString() : "soon"}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">One-time</Badge>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input value={generatedCode} readOnly />
                                    <Button type="button" variant="outline" onClick={copyCode}>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={handleGenerateCode} disabled={loading}>
                            {loading ? "Generating..." : "Generate code"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Merge into another account</DialogTitle>
                        <DialogDescription>
                            Paste the merge code from the account you want to keep. Your links, provider accounts, and sessions will be transferred.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="Enter merge code"
                            value={mergeCode}
                            onChange={(e) => setMergeCode(e.target.value)}
                        />

                        {hasPassword && (
                            <Input
                                type="password"
                                placeholder="Confirm your password"
                                value={mergePassword}
                                onChange={(e) => setMergePassword(e.target.value)}
                            />
                        )}

                        {mergeSummary?.conflicts?.length ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                Platform conflicts were renamed during merge: {mergeSummary.conflicts.join(", ")}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMergeOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCompleteMerge} disabled={loading || !mergeCode.trim()}>
                            {loading ? "Merging..." : "Merge accounts"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
