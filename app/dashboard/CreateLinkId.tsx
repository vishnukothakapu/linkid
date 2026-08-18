"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCsrfToken } from "@/lib/csrfClient";
import { DashboardNavbar } from "../components/DashboardNavbar";
import { Check } from "lucide-react";
import { validateUsername } from "@/lib/validations/username";
import toast, { Toaster } from "react-hot-toast";


export default function CreateLinkId() {
    const [username, setUsername] = useState("");
    const [available, setAvailable] = useState<null | boolean>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const checkUsername = useCallback(async (value: string) => {
        setUsername(value);
        setError(null);

        if (value.length < 3) {
            setAvailable(null);
            setSuggestions([]);
            setChecking(false);
            return;
        }

        const validation = validateUsername(value);
        if (!validation.valid) {
            setAvailable(false);
            setError(validation.error ?? "Invalid username");
            setSuggestions([]);
            setChecking(false);
            return;
        }

        abortRef.current?.abort();
        const abortController = new AbortController();
        abortRef.current = abortController;
        setChecking(true);

        try {
            const res = await fetch(`/api/username/check?username=${value}`, {
                signal: abortController.signal,
            });
            const data = await res.json();
            
            if (abortController.signal.aborted) return;
            
            if (data.available) {
                setAvailable(true);
            } else {
                setAvailable(false);
                setError(data.error ?? "Username already taken");
                setSuggestions(data.suggestions ?? []);
            }
        } catch (e) {
            if (abortController.signal.aborted) return;
            
            console.error("Username check failed:", e);
            setAvailable(null);
            setSuggestions([]);
        } finally {
            if (!abortController.signal.aborted) {
                setChecking(false);
            }
        }
    }, []);

    async function createLinkId() {
        setLoading(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/username/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ username }),
            });
            if (!res.ok) {
                try {
                    const data = await res.json();
                    toast.error(data.error || "Failed to create LinkID. Please try again.");
                } catch {
                    toast.error("Failed to create LinkID. Please try again.");
                }
                return;
            }
            window.location.reload();
        } catch (error) {
            console.error("Failed to create LinkID:", error);
            toast.error("Failed to create LinkID. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <DashboardNavbar />
            <Toaster position="bottom-center" />

            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 space-y-6">
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold">Create your LinkID</h1>
                            <p className="text-sm text-muted-foreground">
                                This will be your public identity
                            </p>
                        </div>

                        {/* LINKID INPUT GROUP */}
                        <div className="space-y-2">
                            <Label>Choose your LinkID</Label>

                            <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
                                <span className="px-3 text-sm text-muted-foreground select-none">
                                    linkid.qzz.io/
                                </span>

                                <Input
                                    className="border-0 focus-visible:ring-0"
                                    placeholder="username"
                                    value={username}
                                    onChange={(e) => checkUsername(e.target.value)}
                                />
                            </div>

                            {checking && (
                                <p className="text-sm text-muted-foreground">Checking...</p>
                            )}
                            {!checking && available === true && (
                                <p className="text-sm text-green-500">
                                    Username available
                                </p>
                            )}

                            {available === false && (
                                <div className="space-y-2">
                                    <p className="text-sm text-red-500">{error || "Username already taken"}</p>
                                    {suggestions.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Suggestions:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestions.map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => checkUsername(s)}
                                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full cursor-pointer"
                            disabled={!available || loading}
                            onClick={createLinkId}
                        >
                            {loading ? "Creating..." : "Create LinkID"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}