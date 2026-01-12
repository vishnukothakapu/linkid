"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
export default function EditProfileCard({
    initialName,
    initialUsername,
    onSuccess,
}: {
    initialName: string;
    initialUsername: string;
    onSuccess?: () => void;
}) {
    const [name, setName] = useState(initialName);
    const [username, setUsername] = useState(initialUsername);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);

    async function checkUsername(value: string) {
        setUsername(value);

        if (value.length < 3 || value === initialUsername) {
            setAvailable(null);
            return;
        }

        const res = await fetch(`/api/username/check?username=${value}`);
        const data = await res.json();
        setAvailable(data.available);
    }

    async function saveChanges() {
        setLoading(true);

        const res = await fetch("/api/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username }),
        });

        setLoading(false);

        if (!res.ok) {
            alert("Failed to update profile");
            return;
        }
        if(onSuccess) onSuccess();
        window.location.reload();
    }

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
                        (!available && username !== initialUsername)
                    }
                >
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    );
}
