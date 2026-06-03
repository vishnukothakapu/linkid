"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCsrfToken } from "@/lib/csrfClient";
import { Check, X } from "lucide-react";

const USERNAME_REGEX = /^[a-zA-Z0-9-]+$/;

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
        const requestId = ++latestRequestId.current;

        const timer = setTimeout(async () => {
            if (username.length < 3 || username === initialUsername) {
                if (requestId === latestRequestId.current) {
                    setAvailable(null);
                    setChecking(false);
                }
                return;
            }

            if (requestId === latestRequestId.current) {
                setChecking(true);
            }

            try {
                const res = await fetch(`/api/username/check?username=${username}`);
                const data = await res.json();

                if (requestId === latestRequestId.current) {
                    setAvailable(data.available);
                }
            } catch {
                if (requestId === latestRequestId.current) {
                    setAvailable(null);
                }
            } finally {
                if (requestId === latestRequestId.current) {
                    setChecking(false);
                }
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [username, initialUsername]);

    function validate(): string | null {
      if (!name.trim())
        return "Name cannot be empty.";
      if (name.trim().length < 2)
        return "Name must be ≥ 2 chars.";
      if (username.trim().length < 3)
        return "Username must be ≥ 3 chars.";
      if (!USERNAME_REGEX.test(username.trim()))
        return "Letters, numbers, _ - only.";
      if (bio.trim().length > 160)
        return "Bio max 160 characters.";
      return null;
    }

    async function saveChanges() {
        const err = validate();
        if (err) { alert(err); return; }
        setLoading(true);
        const csrfToken = await getCsrfToken();

        const res = await fetch("/api/profile/update", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
            },
            body: JSON.stringify({ 
                name: name.trim(), 
                username: username.trim(),
                bio: bio.trim()
            }),
        });

        setLoading(false);

        if (!res.ok) {
            alert("Failed to save draft");
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
                    
                    <div role="status" aria-live="polite" aria-atomic="true">
                        {checking && (
                            <p className="text-sm text-muted-foreground">
                                Checking availability...
                            </p>
                        )}

                        {available === true && (
                            <p className="flex items-center gap-1 text-sm text-green-600">
                                <Check className="h-4 w-4" /> Username available
                            </p>
                        )}

                        {!checking && available === false && (
                            <p className="flex items-center gap-1 text-sm text-red-600">
                                <X className="h-4 w-4" /> Username already taken
                            </p>
                        )}
                    </div>
                </div>
                
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

                <Button
                    onClick={saveChanges}
                    disabled={
                        loading ||
                        checking ||
                        !isDirty ||
                        username.length < 3 ||
                        !USERNAME_REGEX.test(username) ||
                        (!available && username !== initialUsername)
                    }
                >
                    {loading ? "Saving draft..." : "Save as Draft"}
                </Button>

                <p className="text-xs text-muted-foreground">
                    Changes are saved as a draft. Go to{" "}
                    <strong>Actions → Publish Draft</strong> to make them live on your public profile.
                </p>
            </CardContent>
        </Card>
    );
}
