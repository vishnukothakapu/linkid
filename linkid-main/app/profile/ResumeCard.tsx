"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";
import { FileText, Download, Trash2 } from "lucide-react";

interface ResumeCardProps {
    initialResumeUrl: string | null;
    initialDownloadCount: number;
}

export function ResumeCard({ initialResumeUrl, initialDownloadCount }: ResumeCardProps) {
    const [resumeUrl, setResumeUrl] = useState(initialResumeUrl || "");
    const [originalUrl, setOriginalUrl] = useState(initialResumeUrl || "");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [downloadCount, setDownloadCount] = useState(initialDownloadCount);

    const isDirty = resumeUrl.trim() !== (originalUrl || "").trim();

    // Reset when props change
    useEffect(() => {
        setResumeUrl(initialResumeUrl || "");
        setOriginalUrl(initialResumeUrl || "");
        setDownloadCount(initialDownloadCount);
    }, [initialResumeUrl, initialDownloadCount]);

    async function handleSave() {
        if (resumeUrl.trim() && !isUrlValid(resumeUrl.trim())) {
            toast.error("Please enter a valid URL (must end with .pdf, .doc, or .docx)");
            return;
        }

        setSaving(true);
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile/resume", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ 
                    resumeUrl: resumeUrl.trim() || null 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Failed to save resume URL");
                return;
            }

            setOriginalUrl(resumeUrl.trim() || "");
            toast.success("Resume URL saved successfully!");
        } catch (error) {
            toast.error("Failed to save resume URL");
        } finally {
            setSaving(false);
        }
    }

    async function handleRemove() {
        setLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch("/api/profile/resume", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ resumeUrl: null }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Failed to remove resume");
                return;
            }

            setResumeUrl("");
            setOriginalUrl("");
            setDownloadCount(0);
            toast.success("Resume removed");
        } catch (error) {
            toast.error("Failed to remove resume");
        } finally {
            setLoading(false);
        }
    }

    function isUrlValid(url: string): boolean {
        const trimmed = url.trim();
        if (!trimmed) return true; // Empty is valid (removing resume)
        
        try {
            const parsedUrl = new URL(trimmed);
            const pathname = parsedUrl.pathname.toLowerCase();
            return pathname.endsWith(".pdf") || pathname.endsWith(".doc") || pathname.endsWith(".docx");
        } catch {
            return false;
        }
    }

    function getFileType(url: string): string {
        try {
            const parsedUrl = new URL(url);
            const pathname = parsedUrl.pathname.toLowerCase();
            if (pathname.endsWith(".pdf")) return "PDF";
            if (pathname.endsWith(".docx")) return "Word";
            if (pathname.endsWith(".doc")) return "Word";
        } catch {
            // Fallback to simple check if URL parsing fails
        }
        return "Document";
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resume
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="resumeUrl">Resume URL</Label>
                    <Input
                        id="resumeUrl"
                        type="url"
                        placeholder="https://example.com/your-resume.pdf"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX
                    </p>
                </div>

                {originalUrl && (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    Current Resume ({getFileType(originalUrl)})
                                </span>
                            </div>
                            {downloadCount > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    {downloadCount} download{downloadCount !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground break-all">
                            {originalUrl}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {originalUrl && (
                        <Button
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={loading}
                            className="sm:w-auto"
                        >
                            <Trash2 className="h-4 w-4" />
                            {loading ? "Removing..." : "Remove Resume"}
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving || (!isDirty && !!originalUrl)}
                        className="sm:w-auto"
                    >
                        {saving ? "Saving..." : "Save Resume URL"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
