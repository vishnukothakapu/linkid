// app/dashboard/ShareVariantsList.tsx
"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Eye, Plus, Link2 } from "lucide-react";
import { shareVariantUrl } from "@/lib/url";
import { useCsrf } from "@/lib/useCsrf";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

type ShareVariant = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
  viewCount: number;
  accentColor: string | null;
  logo: string | null;
  backgroundColor: string | null;
  backgroundImage: string | null;
  customCss: string | null;
  linkIds: string[];
};

interface Props {
  username: string;
  onEdit: (variant: ShareVariant) => void;
  onCreate: () => void;
  refreshSignal: number;
}

export default function ShareVariantsList({ username, onEdit, onCreate, refreshSignal }: Props) {
  const [variants, setVariants] = useState<ShareVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const csrfToken = useCsrf();

  useEffect(() => {
    fetch("/api/share-variants")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch variants: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setVariants(data);
        setError(null);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load variants";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [refreshSignal]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this share variant?")) return;

    try {
      const token = csrfToken || await getCsrfToken();

      const res = await fetch(`/api/share-variants/${id}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": token,
        },
      });

      if (res.ok) {
        setVariants((prev) => prev.filter((v) => v.id !== id));
        toast.success("Variant deleted");
      } else {
        const errorText = await res.text();
        console.error(`Delete failed with status ${res.status}:`, errorText);
        toast.error("Failed to delete");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error deleting variant:", err);
      toast.error(`Delete error: ${message}`);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading variants…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Share Variants</h2>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus size={15} /> New Variant
        </button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No variants yet. Create one to share a curated set of links.
        </p>
      )}

      <ul className="space-y-3">
        {variants.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: v.accentColor ?? "#6366f1" }}
              />
              <div className="min-w-0">
                <p className="font-medium truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  /{username}/share/{v.slug} · {v.linkIds.length} links · {v.viewCount} views
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 shrink-0">
              {!v.isActive && (
                <span className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                  inactive
                </span>
              )}
              {!v.isPublic && (
                <span className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                  private
                </span>
              )}
              <a
                href={shareVariantUrl(username, v.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1.5 hover:bg-muted transition"
                title="Preview"
              >
                <Eye size={15} />
              </a>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareVariantUrl(username, v.slug));
                    toast.success("Link copied!");
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Failed to copy link";
                    toast.error(message);
                  }
                }}
                className="rounded p-1.5 hover:bg-muted transition"
                title="Copy link"
              >
                <Link2 size={15} />
              </button>
              <button
                onClick={() => onEdit(v)}
                className="rounded p-1.5 hover:bg-muted transition"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(v.id)}
                className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}