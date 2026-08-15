"use client";

import { useState } from "react";
import { verifyPinAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

export default function LockedLinkView({ linkId }: { linkId: string }) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await verifyPinAction(linkId, pin);
        
        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else if (res.success && res.webUrl) {
            if (res.isDeepLink && res.appUrl) {
                window.location.href = res.appUrl;
                setTimeout(() => {
                    window.location.replace(res.webUrl!);
                }, 2000);
            } else {
                window.location.replace(res.webUrl);
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 font-sans text-foreground">
            <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-2xl shadow-sm border text-center">
                <div className="mx-auto w-14 h-14 bg-primary/10 flex items-center justify-center rounded-full">
                    <Lock className="w-7 h-7 text-primary" />
                </div>
                
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Protected Link</h2>
                    <p className="text-muted-foreground text-sm mt-2">
                        This link is locked. Please enter the PIN to continue.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5 mt-8">
                    <div className="space-y-2">
                        <Input 
                            type="password" 
                            placeholder="Enter PIN" 
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            disabled={loading} 
                            className="text-center text-lg tracking-widest h-12" 
                            autoFocus 
                        />
                        {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                    </div>
                    
                    <Button type="submit" className="w-full h-12 text-base" disabled={loading || !pin}>
                        {loading ? "Verifying..." : "Unlock"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
