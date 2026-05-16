// app/dashboard/ShareVariantPreview.tsx
"use client";

import { ExternalLink } from "lucide-react";
import { shareVariantUrl } from "@/lib/url";

type Link = { id: string; platform: string; url: string; label?: string | null };

interface Props {
  username: string;
  slug: string;
  title: string;
  description?: string | null;
  accentColor?: string | null;
  selectedLinks: Link[];
}

export default function ShareVariantPreview({
  username,
  slug,
  title,
  description,
  accentColor = "#6366f1",
  selectedLinks,
}: Props) {
  const color = accentColor ?? "#6366f1";

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden max-w-sm w-full">
      {/* Colour bar */}
      <div className="h-1.5" style={{ backgroundColor: color }} />

      <div className="px-5 py-4 space-y-3">
        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">
            linkid.qzz.io/{username}/share/{slug}
          </p>
          <h3 className="font-semibold text-base">{title || "Untitled Variant"}</h3>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>

        {/* Links */}
        <ul className="space-y-2">
          {selectedLinks.length === 0 && (
            <li className="text-sm text-muted-foreground italic">No links selected</li>
          )}
          {selectedLinks.map((link) => (
            <li key={link.id} className="flex items-center gap-2 text-sm">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium capitalize">{link.label ?? link.platform}</span>
              <ExternalLink size={12} className="text-muted-foreground ml-auto" />
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={shareVariantUrl(username, slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Open Preview <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}