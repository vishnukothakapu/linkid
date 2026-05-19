"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCsrfToken } from "@/lib/csrfClient";
import { Check, X } from "lucide-react";
export default function EditProfileCard({
    initialName,
    initialUsername,
    initialBio,
    onSuccess,
}: {
    initialName: string;
    initialUsername: string;
    initialBio?: string | null;
    onSuccess?: () => void;
}) {
    const [name, setName] = useState(initialName);
    const [username, setUsername] = useState(initialUsername);
    const [bio, setBio] = useState(initialBio || "");
    const [available, setAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const latestRequestId = useRef(0);

    function checkUsername(value: string) {
        setUsername(value);
        setAvailable(null);
    }

    useEffect(() => {
        if (username.length < 3 || username === initialUsername) {
            setAvailable(null);
            setChecking(false);
            return;
        }

        setChecking(true);
        const requestId = ++latestRequestId.current;

        const timer = setTimeout(async () => {
            const res = await fetch(`/api/username/check?username=${username}`);
            const data = await res.json();

            if (requestId === latestRequestId.current) {
                setAvailable(data.available);
                setChecking(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [username]);

    async function saveChanges() {
        setLoading(true);
        const csrfToken = await getCsrfToken();

        const res = await fetch("/api/profile/update", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
            },
            body: JSON.stringify({ name, username,bio }),
        });

        setLoading(false);

        if (!res.ok) {
            alert("Failed to update profile");
            return;
        }
        if(onSuccess) onSuccess();
        window.location.reload();
    }

    const isDirty =
        name.trim() !== initialName.trim() ||
        username.trim() !== initialUsername.trim() ||
        bio.trim() !== (initialBio || "").trim();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* NAME */}
                <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                    />
                </div>

                {/* USERNAME */}
                <div className="space-y-1">
                    <Label>LinkID</Label>

                    <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
                        <span className="px-3 text-sm text-muted-foreground select-none">
                            linkid.qzz.io/
                        </span>

                        <Input
                            className="border-0 focus-visible:ring-0"
                            value={username}
                            onChange={(e) => checkUsername(e.target.value)}
                        />
                    </div>

                    {username !== initialUsername && (
                        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                            ⚠️ <strong>Heads up:</strong> Changing your username may affect existing shared links. Old links will automatically redirect to your new username.
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label>Bio</Label>
                        <textarea
                            className="w-full rounded-md border p-2 text-sm"
                            maxLength={160}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell something about yourself..."
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {bio.length}/160
                        </p>
                    </div>


                    {available === true && (
                        <p className="flex items-center gap-1 text-sm text-green-600">
                            <Check className="h-4 w-4" /> Username available
                        </p>
                    )}

                    {available === false && (
                        <p className="flex items-center gap-1 text-sm text-red-600">
                            <X className="h-4 w-4" /> Username already taken
                        </p>
                    )}
                </div>

                <Button
                    onClick={saveChanges}
                    disabled={
                        loading ||
                        checking ||
                        !isDirty ||
                        username.length < 3 ||
                        (!available && username !== initialUsername)
                    }
                >
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    );
}
