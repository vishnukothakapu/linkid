"use client";

import { useState } from "react";
import { KeyRound, Link2, LogOut, Copy, Check, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getCsrfToken } from "@/lib/csrfClient";
import { ProfileDraft } from "@prisma/client";

type ProfileVersion = {
    id: string;
    snapshot: { name: string | null; username: string | null; bio: string | null; image: string | null };
    changeType: string;
    diff: Record<string, unknown>;
    createdAt: Date;
};

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

interface ProfileActionsCardProps {
    hasPassword: boolean;
    profileDraft?: ProfileDraft | null;
    profileVersions?: ProfileVersion[];
}

export function ProfileActionsCard({ hasPassword, profileDraft, profileVersions = [] }: ProfileActionsCardProps) {
    const [generateOpen, setGenerateOpen] = useState(false);
    const [mergeOpen, setMergeOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [generatePassword, setGeneratePassword] = useState("");
    const [mergePassword, setMergePassword] = useState("");
    const [mergeCode, setMergeCode] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewExpiresAt, setPreviewExpiresAt] = useState<string | null>(null);
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
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to generate merge code");
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

    async function handlePublishDraft() {
        setLoading(true);

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile/publish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data?.error ?? "Unable to publish profile");
                return;
            }

            toast.success("Profile published successfully!");
            setPublishOpen(false);
            window.location.reload();
        } finally {
            setLoading(false);
        }
    }

    async function handleGeneratePreview() {
        setLoading(true);

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile/preview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data?.error ?? "Unable to generate preview link");
                return;
            }

            setPreviewUrl(data.previewUrl);
            setPreviewExpiresAt(data.expiresAt);
            toast.success("Preview link generated");
        } finally {
            setLoading(false);
        }
    }

    async function copyPreviewUrl() {
        if (!previewUrl) return;
        await navigator.clipboard.writeText(previewUrl);
        toast.success("Preview URL copied");
    }

    async function copyCode() {
        if (!generatedCode) return;
        try {
            await navigator.clipboard.writeText(generatedCode);
            toast.success("Merge code copied");
        } catch (error) {
            toast.error("Unable to copy merge code");
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Account Actions Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Account Management
                        </h3>
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap items-center">
                            {profileDraft && (
                                <>
                                    <Button
                                        onClick={() => setPublishOpen(true)}
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 font-medium"
                                    >
                                        <Check className="h-4 w-4" />
                                        Publish Draft
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto font-medium"
                                        onClick={() => setPreviewOpen(true)}
                                    >
                                        <Link2 className="h-4 w-4" />
                                        Preview Draft
                                    </Button>
                                </>
                            )}

                            <Button
                                variant="outline"
                                className="w-full sm:w-auto font-medium"
                                onClick={() => setGenerateOpen(true)}
                            >
                                <KeyRound className="h-4 w-4" />
                                Generate Merge Code
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full sm:w-auto font-medium"
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
                                    className="w-full font-medium"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="border-t pt-5 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Export Profile
                        </h3>
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto font-medium"
                                asChild
                            >
                                <a href="/api/export/vcard">
                                    <Download className="h-4 w-4" />
                                    Contact Card (.vcf)
                                </a>
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full sm:w-auto font-medium"
                                asChild
                            >
                                <a href="/api/export/resume">
                                    <FileText className="h-4 w-4" />
                                    PDF Profile
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Merge Summary */}
                    {mergeSummary?.success && (
                        <div className="w-full rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                            Merge complete: {mergeSummary.mergedLinks ?? 0} links,{" "}
                            {mergeSummary.mergedAccounts ?? 0} connected accounts, and{" "}
                            {mergeSummary.transferredSessions ?? 0} sessions were moved.
                            {mergeSummary.conflicts?.length ? (
                                <span className="block mt-1 text-amber-700">
                                    Conflicts were renamed: {mergeSummary.conflicts.join(", ")}.
                                </span>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Publish Draft Dialog */}
            <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish Draft</DialogTitle>
                        <DialogDescription>
                            Publishing will make your draft changes live to your public profile.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-900 dark:text-blue-200">
                            <strong>Draft changes:</strong>
                            {profileDraft?.name && <p>• Name: {profileDraft.name}</p>}
                            {profileDraft?.username && <p>• Username: {profileDraft.username}</p>}
                            {profileDraft?.bio && <p>• Bio: {profileDraft.bio}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPublishOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePublishDraft} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? "Publishing..." : "Publish"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Preview Draft</DialogTitle>
                        <DialogDescription>
                            Generate a shareable preview link for your draft profile.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {previewUrl && (
                            <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium">Preview link</p>
                                        <p className="text-xs text-muted-foreground">
                                            Expires {previewExpiresAt ? new Date(previewExpiresAt).toLocaleString() : "in 7 days"}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">Expires</Badge>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input value={previewUrl} readOnly />
                                    <Button type="button" variant="outline" onClick={copyPreviewUrl}>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            Close
                        </Button>
                        {!previewUrl && (
                            <Button onClick={handleGeneratePreview} disabled={loading}>
                                {loading ? "Generating..." : "Generate Preview"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

