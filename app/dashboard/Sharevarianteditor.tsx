// app/dashboard/ShareVariantEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toSlug } from "@/lib/url";
import { useCsrf } from "@/lib/useCsrf";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

type Link = { id: string; platform: string; url: string; label?: string | null };

type ShareVariant = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
  accentColor: string | null;
  logo: string | null;
  backgroundColor: string | null;
  backgroundImage: string | null;
  customCss: string | null;
  linkIds: string[];
};

interface Props {
  variant: ShareVariant | null; // null = create mode
  userLinks: Link[];
  onClose: () => void;
  onSaved: () => void;
}

const ACCENT_PRESETS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

export default function ShareVariantEditor({ variant, userLinks, onClose, onSaved }: Props) {
  const isEdit = !!variant;
  const csrfToken = useCsrf();

  const [title, setTitle] = useState(variant?.title ?? "");
  const [slug, setSlug] = useState(variant?.slug ?? "");
  const [description, setDescription] = useState(variant?.description ?? "");
  const [accentColor, setAccentColor] = useState(variant?.accentColor ?? "#6366f1");
  const [backgroundColor, setBackgroundColor] = useState(variant?.backgroundColor ?? "#f59e0b");
  const [isPublic, setIsPublic] = useState(variant?.isPublic ?? true);
  const [isActive, setIsActive] = useState(variant?.isActive ?? true);
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>(variant?.linkIds ?? []);
  const [logo, setLogo] = useState(variant?.logo ?? "");
  const [backgroundImage, setBackgroundImage] = useState(variant?.backgroundImage ?? "");
  const [customCss, setCustomCss] = useState(variant?.customCss ?? "");
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (!isEdit && title) setSlug(toSlug(title));
  }, [title, isEdit]);

  function toggleLink(id: string) {
    setSelectedLinkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    setSaving(true);

      const payload = { title, slug, description, accentColor, logo, backgroundColor, isPublic, isActive, backgroundImage, customCss, linkIds: selectedLinkIds };
    const url = isEdit ? `/api/share-variants/${variant.id}` : "/api/share-variants";
    const method = isEdit ? "PUT" : "POST";

    const token = csrfToken || await getCsrfToken();

    const res = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "x-csrf-token": token,
      },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      toast.success(isEdit ? "Variant updated" : "Variant created");
      onSaved();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">
            {isEdit ? "Edit Variant" : "New Share Variant"}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Recruiter View"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <div className="flex items-center rounded-md border bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground mr-1">/share/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 bg-transparent focus:outline-none"
                placeholder="recruiter"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A short description for this variant"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Accent colour */}
          {/* Logo URL */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">Logo URL (optional)</label>
                      <input
                        type="url"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {logo && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={logo} alt="Logo preview" className="h-8 w-8 rounded object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          <p className="text-xs text-muted-foreground">Logo preview</p>
                        </div>
                      )}
                    </div>

                    {/* Background Image */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">Background Image URL (optional)</label>
                      <input
                        type="url"
                        value={backgroundImage}
                        onChange={(e) => setBackgroundImage(e.target.value)}
                        placeholder="https://example.com/bg.jpg"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {backgroundImage && (
                        <p className="mt-2 text-xs text-muted-foreground">Preview will show on the share page</p>
                      )}
                    </div>

                    {/* Custom CSS */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">Custom CSS (optional)</label>
                      <textarea
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        rows={3}
                        placeholder=".custom-class { color: red; }"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">CSS applied to the entire page. Keep it simple!</p>
                    </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Accent Colour</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition"
                  style={{
                    backgroundColor: c,
                    borderColor: accentColor === c ? "white" : "transparent",
                    outline: accentColor === c ? `2px solid ${c}` : "none",
                  }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border"
                title="Custom colour"
              />
            </div>
              <label className="mb-2 block text-sm font-medium">Background Colour</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBackgroundColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition"
                  style={{
                    backgroundColor: c,
                    borderColor: backgroundColor === c ? "white" : "transparent",
                    outline: backgroundColor === c ? `2px solid ${c}` : "none",
                  }}
                />
              ))}
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded border"
                title="Custom colour"
              />
            </div>
          </div>

          {/* Link selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Included Links ({selectedLinkIds.length} selected)
            </label>
            {userLinks.length === 0 && (
              <p className="text-sm text-muted-foreground">No links added yet.</p>
            )}
            <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-md border p-2">
              {userLinks.map((link) => (
                <label
                  key={link.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted transition text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedLinkIds.includes(link.id)}
                    onChange={() => toggleLink(link.id)}
                    className="accent-primary"
                  />
                  <span className="font-medium capitalize">{link.platform}</span>
                  {link.label && <span className="text-muted-foreground">— {link.label}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-primary"
              />
              Public
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-primary"
              />
              Active
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Variant"}
          </button>
        </div>
      </div>
    </div>
  );
}