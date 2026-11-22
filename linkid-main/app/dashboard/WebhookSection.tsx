import { useState } from "react";
import toast from "react-hot-toast";

interface WebhookSectionProps {
    workspaceId: string;
    initialWebhookUrl?: string | null;
    initialWebhookSecret?: string | null;
    onUpdate?: (url: string | null, secret: string | null) => void;
}

export function WebhookSection({ workspaceId, initialWebhookUrl, initialWebhookSecret, onUpdate }: WebhookSectionProps) {
    const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl || "");
    const [secret, setSecret] = useState(initialWebhookSecret || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "x-workspace-id": workspaceId
                },
                body: JSON.stringify({ webhookUrl: webhookUrl.trim() === "" ? "" : webhookUrl }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Webhook settings saved!");
                setSecret(data.webhookSecret || "");
                if (onUpdate) onUpdate(data.webhookUrl, data.webhookSecret);
            } else {
                toast.error(data.error || "Failed to save webhook settings");
            }
        } catch (error) {
            toast.error("Failed to save webhook settings");
        }
        setSaving(false);
    };

    return (
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Developer Webhooks</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Receive real-time HTTP POST requests whenever a visitor clicks a link on your profile.
            </p>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Payload URL</label>
                    <input 
                        type="url" 
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://example.com/webhook"
                        className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                {secret && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Signing Secret</label>
                        <input 
                            type="text" 
                            readOnly
                            value={secret}
                            className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Use this secret to verify the HMAC SHA256 signature in the x-linkid-signature header.</p>
                    </div>
                )}
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Webhook"}
                </button>
            </div>
        </div>
    );
}
