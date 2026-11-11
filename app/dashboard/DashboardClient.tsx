"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";
import { getCsrfToken } from "@/lib/csrfClient";
import toast, { Toaster } from "react-hot-toast";
import { LinksSection } from "./LinksSection";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import { LinkIdCard } from "./LinkIdCard";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { VersionHistory } from "@/components/dashboard/VersionHistory";
import { AppearanceSection } from "./AppearanceSection";
import { SeoSection } from "./SeoSection";
import { LayoutStyle } from "@/app/[username]/types/type";
import { LivePreview } from "@/components/dashboard/LivePreview";
import { WebhookSection } from "./WebhookSection";

export default function DashboardClient({
    userId,
    workspaceId,
    username,
    initialLinks,
    initialTheme,
    initialSeoTitle,
    initialSeoDescription,
    initialLayout,
    initialBackgroundImage,
    qrCode,
    enableEmailCapture,
    subscribers = [],
    initialName,
    initialBio,
    initialImage,
    initialIsVerified,
    initialThemeType,
    initialThemeColor,
    initialThemeCustom,
    initialWebhookUrl,
    initialWebhookSecret,
}: {
    userId?: string;
    workspaceId: string;
    username: string;
    initialLinks: ProfileLink[];
    initialTheme?: string;
    initialSeoTitle?: string;
    initialSeoDescription?: string;
    initialLayout?: LayoutStyle;
    initialBackgroundImage?: string | null;
    qrCode?: React.ReactNode;
    enableEmailCapture?: boolean;
    subscribers?: { id: string; email: string; createdAt: Date }[];
    initialName?: string | null;
    initialBio?: string | null;
    initialImage?: string | null;
    initialIsVerified?: boolean;
    initialThemeType?: string;
    initialThemeColor?: string;
    initialThemeCustom?: string | null;
    initialWebhookUrl?: string | null;
    initialWebhookSecret?: string | null;
}) {
    const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl ?? null);
    const [webhookSecret, setWebhookSecret] = useState(initialWebhookSecret ?? null);
    const router = useRouter();
    const [links, setLinks] = useState(initialLinks);

    useEffect(() => {
        setLinks(initialLinks);
    }, [initialLinks]);

    useEffect(() => {
        if (!userId) return;

        const pusher = getPusherClient();
        if (!pusher) return;

        const channelName = `private-user-${userId}`;
        const channel = pusher.subscribe(channelName);

        channel.bind('links-updated', () => {
            router.refresh();
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(channelName);
        };
    }, [userId, router]);

    const [theme, setTheme] = useState(initialTheme || "default");
    const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(initialLayout || "LIST");
    const [backgroundImage, setBackgroundImage] = useState<string | null>(initialBackgroundImage || "");
    const [seoTitle, setSeoTitle] = useState(initialSeoTitle || "");
    const [seoDescription, setSeoDescription] = useState(initialSeoDescription || "");
    const [activeTab, setActiveTab] = useState<"links" | "appearance" | "seo" | "webhooks">("links");
    const [showAdd, setShowAdd] = useState(false);
    const [showGroupAdd, setShowGroupAdd] = useState(false);
    const [isEmailCaptureEnabled, setIsEmailCaptureEnabled] = useState(enableEmailCapture ?? false);
    const [isPendingEmailCapture, setIsPendingEmailCapture] = useState(false);

    async function toggleEmailCapture() {
        if (isPendingEmailCapture) return;
        const newValue = !isEmailCaptureEnabled;
        setIsPendingEmailCapture(true);
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                    'x-workspace-id': workspaceId,
                },
                body: JSON.stringify({ enableEmailCapture: newValue }),
            });
            if (!response.ok) throw new Error();
            const data = await response.json();
            setIsEmailCaptureEnabled(data.enableEmailCapture);
            toast.success(data.enableEmailCapture ? "Email capture enabled" : "Email capture disabled");
        } catch {
            toast.error("Failed to update email capture settings");
        } finally {
            setIsPendingEmailCapture(false);
        }
    }

    async function addLink(link: ProfileLink) {
        setLinks((prev) => [...prev, link]);
        setShowAdd(false);
    }

    async function addGroup(group: ProfileLink) {
        setLinks((prev) => [...prev, { ...group, children: group.children || [] }]);
        setShowGroupAdd(false);
    }

    async function updateLink(id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null, pinCode?: string | null, isSocialIcon?: boolean): Promise<boolean> {
        const csrfToken = await getCsrfToken();

        try {
            const response = await fetch(`/api/links/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                    "x-workspace-id": workspaceId,
                },
                body: JSON.stringify({ url, label, platform, startDate, endDate, pinCode, isSocialIcon }),
            });

            if (!response.ok) {
                try {
                    const data = await response.json();
                    toast.error(data.error ?? "Failed to update link");
                } catch {
                    toast.error("Failed to update link");
                }
                return false;
            }

            const responseData = await response.json();
            toast.success("Link updated");

            // Update link in nested structure
            setLinks((prev) =>
                prev.map((l) => {
                    if (l.id === id) return { ...l, ...responseData.link };
                    if (l.isGroup && l.children) {
                        return {
                            ...l,
                            children: l.children.map((c) =>
                                c.id === id ? { ...c, ...responseData.link } : c
                            ),
                        };
                    }
                    return l;
                })
            );
            return true;
        } catch (error) {
            console.error("Link update failed:", error);
            toast.error("Failed to update link");
            return false;
        }
    }

    async function updateVisibility(id: string, isPublic: boolean) {
        const csrfToken = await getCsrfToken();

        const response = await fetch(`/api/links/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
                "x-workspace-id": workspaceId,
            },
            body: JSON.stringify({ isPublic }),
        });

        if (!response.ok) {
            toast.error("Unable to update visibility");
            return;
        }

        toast.success(isPublic ? "Link set to public" : "Link set to private");

        setLinks((prev) =>
            prev.map((l) => {
                if (l.id === id) return { ...l, isPublic };
                if (l.isGroup && l.children) {
                    return {
                        ...l,
                        children: l.children.map((c) =>
                            c.id === id ? { ...c, isPublic } : c
                        ),
                    };
                }
                return l;
            })
        );
    }

    async function exportCsv() {
        const response = await fetch(`/api/links/export?workspaceId=${encodeURIComponent(workspaceId)}`, {
            headers: { "x-workspace-id": workspaceId },
        });

        if (!response.ok) {
            toast.error("Unable to export CSV");
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `linkid-links-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async function exportSubscribersCsv() {
        try {
            const response = await fetch(`/api/subscribers/export?workspaceId=${encodeURIComponent(workspaceId)}`, {
                headers: { "x-workspace-id": workspaceId },
            });
            if (!response.ok) throw new Error();

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `linkid-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error("Unable to export subscribers");
        }
    }

async function deleteLink(id: string) {
    // Find the link before removing it so we can restore it
    // at the exact same position if Undo is clicked.
    let deletedLink: typeof links[number] | undefined;
    let deletedIndex = -1;
    let parentGroupId: string | null = null;
    let childIndex = -1;

    // Check top-level links first.
    const topLevelIndex = links.findIndex((link) => link.id === id);

    if (topLevelIndex !== -1) {
        deletedLink = links[topLevelIndex];
        deletedIndex = topLevelIndex;
    } else {
        // Check links inside groups.
        for (const link of links) {
            if (link.isGroup && link.children) {
                const index = link.children.findIndex(
                    (child) => child.id === id
                );

                if (index !== -1) {
                    deletedLink = link.children[index];
                    childIndex = index;
                    parentGroupId = link.id;
                    break;
                }
            }
        }
    }

    // Nothing found, so there is nothing to delete.
    if (!deletedLink) {
        return;
    }

    // Restore only this deleted link.
    const restoreDeletedLink = () => {
        setLinks((prev) => {
            // Don't restore if the link already exists.
            if (
                prev.some((link) => link.id === id) ||
                prev.some(
                    (link) =>
                        link.isGroup &&
                        link.children?.some((child) => child.id === id)
                )
            ) {
                return prev;
            }

            // Restore a top-level link.
            if (!parentGroupId) {
                const restoredLinks = [...prev];
                restoredLinks.splice(deletedIndex, 0, deletedLink!);
                return restoredLinks;
            }

            // Restore a child inside its original group.
            return prev.map((group) => {
                if (group.id !== parentGroupId || !group.isGroup) {
                    return group;
                }

                const children = [...(group.children || [])];

                children.splice(childIndex, 0, deletedLink!);

                return {
                    ...group,
                    children,
                };
            });
        });
    };

    // ---------------------------------------------------------
    // OPTIMISTIC DELETE
    // ---------------------------------------------------------
    // Remove the link immediately from the UI.
    setLinks((prev) =>
        prev
            .filter((link) => link.id !== id)
            .map((link) => {
                if (link.isGroup && link.children) {
                    return {
                        ...link,
                        children: link.children.filter(
                            (child) => child.id !== id
                        ),
                    };
                }

                return link;
            })
    );

    let deleteTimer: ReturnType<typeof setTimeout>;

    // ---------------------------------------------------------
    // PERFORM SERVER DELETE
    // ---------------------------------------------------------
    const performDelete = async () => {
        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch(`/api/links/${id}`, {
                method: "DELETE",
                headers: {
                    "x-csrf-token": csrfToken,
                    "x-workspace-id": workspaceId,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete link");
            }

            toast.success("Link deleted");
        } catch (error) {
            console.error("Link deletion failed:", error);

            // Restore only the deleted link if the server request fails.
            restoreDeletedLink();

            toast.error("Failed to delete link");
        }
    };

    // ---------------------------------------------------------
    // UNDO TOAST
    // ---------------------------------------------------------
    const toastId = toast.custom(
        (t) => (
            <div
                className={`${
                    t.visible ? "animate-enter" : "animate-leave"
                } flex items-center gap-4 rounded-lg bg-foreground px-4 py-3 text-background shadow-lg`}
            >
                <span>Link deleted</span>

                <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => {
                        // Cancel the permanent deletion timer.
                        clearTimeout(deleteTimer);

                        // Close the toast.
                        toast.dismiss(t.id);

                        // Restore only this deleted link.
                        restoreDeletedLink();
                    }}
                >
                    Undo
                </button>
            </div>
        ),
        {
            duration: 5000,
        }
    );

    // ---------------------------------------------------------
    // PERMANENT DELETE AFTER 5 SECONDS
    // ---------------------------------------------------------
    deleteTimer = setTimeout(() => {
        toast.dismiss(toastId);
        performDelete();
    }, 5000);
}

    async function deleteGroup(groupId: string, deleteChildren: boolean) {
        const csrfToken = await getCsrfToken();

        const res = await fetch(`/api/links/${groupId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
                "x-workspace-id": workspaceId,
            },
            body: JSON.stringify({ deleteChildren }),
        });

        if (!res.ok) {
            toast.error("Failed to delete group");
            return;
        }

        if (deleteChildren) {
            toast.success("Group and links deleted");
            setLinks((prev) => prev.filter((l) => l.id !== groupId));
        } else {
            toast.success("Group removed, links ungrouped");
            setLinks((prev) => {
                const group = prev.find((l) => l.id === groupId);
                const ungroupedChildren = (group?.children || []).map((c) => ({
                    ...c,
                    parentId: null,
                }));
                const withoutGroup = prev.filter((l) => l.id !== groupId);
                // Insert ungrouped children at the position where the group was
                const groupIndex = prev.findIndex((l) => l.id === groupId);
                withoutGroup.splice(groupIndex, 0, ...ungroupedChildren);
                return withoutGroup;
            });
        }
    }

    async function renameGroup(groupId: string, newName: string) {
        const csrfToken = await getCsrfToken();

        const res = await fetch(`/api/links/${groupId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
                "x-workspace-id": workspaceId,
            },
            body: JSON.stringify({ label: newName }),
        });

        if (!res.ok) {
            toast.error("Failed to rename group");
            return;
        }

        toast.success("Group renamed");
        setLinks((prev) =>
            prev.map((l) =>
                l.id === groupId ? { ...l, label: newName } : l
            )
        );
    }

    return (
        <>
            <DashboardNavbar />
            <Toaster position="bottom-center" />

            <main className="mx-auto max-w-[1400px] px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Editor Area */}
                    <div className="flex-1 space-y-10 min-w-0">
                        <section>
                    <h1 className="text-3xl font-bold">Welcome, {username}</h1>
                    <p className="text-muted-foreground">
                        Manage and share your professional links
                    </p>
                </section>

                <LinkIdCard username={username} qrCode={qrCode} />

                <div className="w-full">
                    <AnalyticsOverview />
                </div>

                <div className="flex gap-4 border-b">
                    <button 
                        className={`pb-2 px-1 text-sm font-medium ${activeTab === 'links' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('links')}
                    >
                        Links
                    </button>
                    <button 
                        className={`pb-2 px-1 text-sm font-medium ${activeTab === 'appearance' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        Appearance
                    </button>
                    <button 
                        className={`pb-2 px-1 text-sm font-medium ${activeTab === 'seo' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('seo')}
                    >
                        SEO
                    </button>
                    <button 
                        className={`pb-2 px-1 text-sm font-medium ${activeTab === 'webhooks' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('webhooks')}
                    >
                        Webhooks
                    </button>
                </div>

                {activeTab === 'links' ? (
                    <div className="space-y-6">
                        <section className="bg-card p-6 rounded-xl border shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Email Subscribers</h2>
                                    <p className="text-sm text-muted-foreground">Collect emails directly from your LinkID page.</p>
                                </div>
                                <label className={`flex items-center cursor-pointer ${isPendingEmailCapture ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isEmailCaptureEnabled} onChange={toggleEmailCapture} disabled={isPendingEmailCapture} />
                                        <div className={`block w-14 h-8 rounded-full ${isEmailCaptureEnabled ? 'bg-primary' : 'bg-muted'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-background w-6 h-6 rounded-full transition ${isEmailCaptureEnabled ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                            {isEmailCaptureEnabled && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium">Total Subscribers: {subscribers.length}</p>
                                        {subscribers.length > 0 && (
                                            <button 
                                                onClick={exportSubscribersCsv}
                                                className="text-xs font-medium px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                                            >
                                                Export CSV
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border rounded-md">
                                        {subscribers.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No subscribers yet.</p>
                                        ) : (
                                            <ul className="divide-y text-sm">
                                                {subscribers.map(sub => (
                                                    <li key={sub.id} className="p-2 px-4 flex justify-between">
                                                        <span>{sub.email}</span>
                                                        <span className="text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        <LinksSection
                            username={username}
                            links={links}
                            showAdd={showAdd}
                            setShowAdd={setShowAdd}
                            showGroupAdd={showGroupAdd}
                            setShowGroupAdd={setShowGroupAdd}
                            onExport={exportCsv}
                            onAdd={addLink}
                            onAddGroup={addGroup}
                            onUpdate={updateLink}
                            onToggleVisibility={updateVisibility}
                            onDelete={deleteLink}
                            onDeleteGroup={deleteGroup}
                            onRenameGroup={renameGroup}
                            onReorder={setLinks}
                        />
                    </div>
                ) : activeTab === 'appearance' ? (
                    <div className="space-y-6">
                        <AppearanceSection 
                            workspaceId={workspaceId}
                            initialTheme={theme} 
                            initialLayout={layoutStyle}
                            initialBackgroundImage={backgroundImage ?? undefined}
                            onUpdateTheme={setTheme} 
                            onUpdateLayout={setLayoutStyle}
                            onUpdateBackgroundImage={setBackgroundImage}
                        />
                        <VersionHistory />
                    </div>
                ) : activeTab === 'seo' ? (
                    <SeoSection 
                        workspaceId={workspaceId}
                        initialTitle={seoTitle}
                        initialDescription={seoDescription}
                        onUpdateSeo={(title, desc) => {
                            setSeoTitle(title);
                            setSeoDescription(desc);
                        }}
                    />
                ) : (
                    <WebhookSection
                        workspaceId={workspaceId}
                        initialWebhookUrl={webhookUrl}
                        initialWebhookSecret={webhookSecret}
                        onUpdate={(url, secret) => {
                            setWebhookUrl(url);
                            setWebhookSecret(secret);
                        }}
                    />
                )}

                        <footer className="pt-10 border-t text-center text-sm text-muted-foreground">
                            © {new Date().getFullYear()} LinkID · Built for developers
                        </footer>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="w-full lg:w-[400px] shrink-0 mt-10 lg:mt-0">
                        <div className="lg:sticky lg:top-10 mx-auto max-w-[400px] w-full border-[14px] border-zinc-900 rounded-[3rem] h-[800px] overflow-hidden shadow-2xl relative bg-background">
                            {/* Mobile Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 bg-zinc-900 rounded-b-3xl w-40 mx-auto z-50"></div>
                            
                            <LivePreview 
                                username={username}
                                links={links}
                                theme={theme}
                                layoutStyle={layoutStyle}
                                backgroundImage={backgroundImage}
                                name={initialName || null}
                                bio={initialBio || null}
                                image={initialImage || null}
                                isVerified={initialIsVerified || false}
                                enableEmailCapture={isEmailCaptureEnabled}
                                themeType={initialThemeType || "solid"}
                                themeColor={initialThemeColor || "#64748b"}
                                themeCustom={initialThemeCustom || null}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
