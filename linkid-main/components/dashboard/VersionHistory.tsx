"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

type ProfileVersion = {
  id: string;
  snapshot: {
    name: string | null;
    username: string | null;
    bio: string | null;
    image: string | null;
  };
  changeType: string;
  diff: Record<string, { before: unknown; after: unknown }>;
  createdAt: string;
};

export function VersionHistory() {
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchVersions() {
    try {
      const res = await fetch("/api/profile/versions");
      if (!res.ok) return;
      const json = await res.json() as { versions: ProfileVersion[] };
      setVersions(json.versions || []);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchVersions();
  }, []);

  const handleRollback = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version of your profile? Current draft progress may be overwritten.")) {
      return;
    }

    setRestoringId(versionId);
    const csrfToken = await getCsrfToken();

    try {
      const res = await fetch(`/api/profile/versions/${versionId}/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      });

      if (!res.ok) {
        const errorData = await res.json() as { error?: string };
        throw new Error(errorData.error || "Failed to rollback profile");
      }

      toast.success("Profile restored successfully!");
      // Reload page to refresh dashboard state and display updated profile fields
      window.location.reload();
    } catch (err: unknown) {
      console.error("Rollback error:", err);
      toast.error(err instanceof Error ? err.message : "Restoring profile failed");
    } finally {
      setRestoringId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Version History</CardTitle>
          </div>
          <CardDescription>No past profile versions saved yet. Publish your profile to create a version snapshot.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Version History</CardTitle>
        </div>
        <CardDescription>
          Compare differences and restore previous versions of your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[350px] overflow-y-auto space-y-4 pr-2">
        {versions.map((ver) => {
          const isExpanded = expandedId === ver.id;
          const diffKeys = Object.keys(ver.diff || {});

          return (
            <div
              key={ver.id}
              className="flex flex-col rounded-lg border border-border bg-card/50 p-3.5 transition-colors hover:bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {ver.snapshot.name || ver.snapshot.username || "Anonymous"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ver.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {diffKeys.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleExpand(ver.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    disabled={restoringId !== null}
                    onClick={() => handleRollback(ver.id)}
                  >
                    {restoringId === ver.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Restore</span>
                  </Button>
                </div>
              </div>

              {/* Diff section */}
              {isExpanded && diffKeys.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
                  <div className="font-semibold text-muted-foreground mb-1">Changes made:</div>
                  {diffKeys.map((key) => {
                    const beforeVal = ver.diff[key].before !== null && ver.diff[key].before !== undefined
                      ? String(ver.diff[key].before)
                      : "empty";
                    const afterVal = ver.diff[key].after !== null && ver.diff[key].after !== undefined
                      ? String(ver.diff[key].after)
                      : "empty";

                    return (
                      <div key={key} className="grid grid-cols-3 gap-2 py-0.5">
                        <span className="font-medium capitalize text-muted-foreground">{key}:</span>
                        <span className="line-through text-red-500 truncate">{beforeVal}</span>
                        <span className="text-green-500 font-medium truncate">{afterVal}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
