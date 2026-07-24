"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export function NewsletterSubscribeBlock({ username }: { username: string }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubscribe(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, username }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to subscribe");
            }

            toast.success("Subscribed successfully!");
            setEmail("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to subscribe";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl shadow-sm my-4">
            <div className="text-center mb-3">
                <h3 className="font-semibold">Subscribe to my Newsletter</h3>
                <p className="text-xs opacity-80 mt-1">Get the latest updates right in your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {loading ? "..." : "Subscribe"}
                </button>
            </form>
        </div>
    );
}
