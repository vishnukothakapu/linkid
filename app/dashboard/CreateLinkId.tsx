"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardNavbar } from "../components/DashboardNavbar";

export default function CreateLinkId() {
    const [username, setUsername] = useState("");
    const [available, setAvailable] = useState<null | boolean>(null);
    const [loading, setLoading] = useState(false);

    async function checkUsername(value: string) {
        setUsername(value);

        if (value.length < 3) {
            setAvailable(null);
            return;
        }

        const res = await fetch(`/api/username/check?username=${value}`);
        const data = await res.json();
        setAvailable(data.available);
    }

    async function createLinkId() {
        setLoading(true);
        const res = await fetch("/api/username/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
        });
        setLoading(false);
        if (!res.ok) {
            alert("Failed to create LinkID. Please try again.");
            return;
        }
        window.location.reload();
    }

    return (
        <>
            <DashboardNavbar />

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
                                    linkid.me/
                                </span>

                                <Input
                                    className="border-0 focus-visible:ring-0"
                                    placeholder="username"
                                    value={username}
                                    onChange={(e) => checkUsername(e.target.value)}
                                />
                            </div>

                            {available === true && (
                                <p className="text-sm text-green-500">
                                    Username available
                                </p>
                            )}

                            {available === false && (
                                <p className="text-sm text-red-500">
                                    Username already taken
                                </p>
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
