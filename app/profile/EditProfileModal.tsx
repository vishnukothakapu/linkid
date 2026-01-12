"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EditProfileCard from "./EditProfileCard";

export default function EditProfileModal({
    initialName,
    initialUsername,
}: {
    initialName: string;
    initialUsername: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto"
                    aria-label="Edit profile"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md space-y-2">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>

                
                {initialUsername && (
                    <Alert className="border-yellow-500/30 bg-yellow-500/10">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-700">
                            Changing your username
                        </AlertTitle>
                        <AlertDescription className="text-sm text-yellow-700">
                            If you change your username, your previous LinkID URLs will stop
                            working.
                            <br />
                            <span className="font-mono">
                                linkid.qzz.io/{initialUsername}/...
                            </span>
                        </AlertDescription>
                    </Alert>
                )}

                <EditProfileCard
                    initialName={initialName}
                    initialUsername={initialUsername}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
