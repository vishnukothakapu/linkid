"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

type ThemeType = "solid" | "gradient" | "glassmorphism" | "retro" | "cyberpunk";

const PRESET_GRADIENTS = [
  { name: "Ocean Breeze", from: "#0f172a", to: "#0369a1", value: "#0f172a,#0369a1" },
  { name: "Sunset Glow", from: "#1e1b4b", to: "#b91c1c", value: "#1e1b4b,#b91c1c" },
  { name: "Forest Mist", from: "#062f4f", to: "#133337", value: "#062f4f,#133337" },
  { name: "Midnight Magic", from: "#020617", to: "#3b0764", value: "#020617,#3b0764" },
];

const PRESET_SOLIDS = [
  { name: "Classic Slate", value: "#0f172a" },
  { name: "Royal Blue", value: "#1e3a8a" },
  { name: "Deep Emerald", value: "#064e3b" },
  { name: "Rich Crimson", value: "#7f1d1d" },
];

export function ThemeBuilderCard({
  userId,
  initialThemeType,
  initialThemeColor,
  initialThemeCustom,
  userName,
  userBio,
  userImage,
}: {
  userId: string;
  initialThemeType?: string | null;
  initialThemeColor?: string | null;
  initialThemeCustom?: string | null;
  userName: string | null;
  userBio: string | null;
  userImage: string | null;
}) {
  const [themeType, setThemeType] = useState<ThemeType>((initialThemeType as ThemeType) || "solid");
  const [themeColor, setThemeColor] = useState(initialThemeColor || "#0f172a");
  const [themeCustom, setThemeCustom] = useState(initialThemeCustom || "");
  const [loading, setLoading] = useState(false);

  // Parse custom gradient values
  const gradientColors = useMemo(() => {
    if (themeType !== "gradient") return null;
    const parts = themeCustom.split(",");
    return {
      from: parts[0] || "#0f172a",
      to: parts[1] || "#0369a1",
    };
  }, [themeType, themeCustom]);

  const handleCustomGradientChange = (type: "from" | "to", hex: string) => {
    const fromColor = type === "from" ? hex : gradientColors?.from || "#0f172a";
    const toColor = type === "to" ? hex : gradientColors?.to || "#0369a1";
    setThemeCustom(`${fromColor},${toColor}`);
  };

  const selectPreset = (type: ThemeType, val: string) => {
    if (type === "solid") {
      setThemeColor(val);
      setThemeCustom("");
    } else if (type === "gradient") {
      setThemeColor("custom");
      setThemeCustom(val);
    }
  };

  // Preview styling calculations
  const previewBackgroundStyle = useMemo(() => {
    switch (themeType) {
      case "solid":
        return { backgroundColor: themeColor };
      case "gradient":
        if (themeColor === "custom") {
          const from = gradientColors?.from || "#0f172a";
          const to = gradientColors?.to || "#0369a1";
          return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
        }
        return { backgroundColor: "#0f172a" };
      case "glassmorphism":
        return {
          backgroundColor: "#030712",
          backgroundImage: "radial-gradient(ellipse at top, #1e293b, transparent)",
        };
      case "retro":
        return { backgroundColor: "#000000", fontFamily: "monospace" };
      case "cyberpunk":
        return {
          backgroundColor: "#050505",
          backgroundImage: "linear-gradient(180deg, #09090b 0%, #1e1b4b 100%)",
        };
      default:
        return { backgroundColor: "#0f172a" };
    }
  }, [themeType, themeColor, gradientColors]);

  const previewCardStyle = useMemo(() => {
    switch (themeType) {
      case "glassmorphism":
        return "bg-white/5 border border-white/10 backdrop-blur-md text-white shadow-2xl";
      case "retro":
        return "bg-black border-2 border-green-500 text-green-500 font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)]";
      case "cyberpunk":
        return "bg-zinc-950 border border-pink-500 text-cyan-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
      default:
        return "bg-slate-900/60 border border-slate-800 text-white shadow-xl";
    }
  }, [themeType]);

  const saveTheme = async () => {
    setLoading(true);
    const csrfToken = await getCsrfToken();

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          themeType,
          themeColor,
          themeCustom,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save theme");
      }

      toast.success("Theme configuration saved as draft!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save theme customization");
    } finally {
      setLoading(false);
    }
  };

  const isDirty =
    themeType !== (initialThemeType || "solid") ||
    themeColor !== (initialThemeColor || "#0f172a") ||
    themeCustom !== (initialThemeCustom || "");

  return (
    <Card className="grid gap-6 md:grid-cols-2">
      {/* Editor Controls */}
      <div className="flex flex-col justify-between p-6">
        <div className="space-y-5">
          <div>
            <CardTitle className="text-xl">Profile Theme Builder</CardTitle>
            <CardDescription className="mt-1">
              Personalize your public profile with colors, presets, and layouts.
            </CardDescription>
          </div>

          {/* Theme Type */}
          <div className="space-y-1.5">
            <Label>Theme Preset</Label>
            <Select
              value={themeType}
              onValueChange={(v) => {
                const type = v as ThemeType;
                setThemeType(type);
                // Set default configs based on switch
                if (type === "solid") {
                  setThemeColor("#0f172a");
                  setThemeCustom("");
                } else if (type === "gradient") {
                  setThemeColor("custom");
                  setThemeCustom("#0f172a,#0369a1");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Background</SelectItem>
                <SelectItem value="gradient">Gradient Background</SelectItem>
                <SelectItem value="glassmorphism">Glassmorphism Preset</SelectItem>
                <SelectItem value="retro">Retro Terminal Preset</SelectItem>
                <SelectItem value="cyberpunk">Cyberpunk Neon Preset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Solid Color Config */}
          {themeType === "solid" && (
            <div className="space-y-3">
              <Label>Solid Presets</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SOLIDS.map((p) => (
                  <button
                    key={p.name}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      themeColor === p.value ? "border-white scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: p.value }}
                    onClick={() => selectPreset("solid", p.value)}
                    title={p.name}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Custom Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-10 w-16 p-1 cursor-pointer"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                  />
                  <Input
                    type="text"
                    className="flex-1 font-mono uppercase"
                    value={themeColor}
                    maxLength={7}
                    onChange={(e) => setThemeColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Gradient Color Config */}
          {themeType === "gradient" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Gradient Presets</Label>
                <div className="flex gap-2">
                  {PRESET_GRADIENTS.map((p) => (
                    <button
                      key={p.name}
                      className="h-10 w-16 rounded-md border border-slate-700 transition-all hover:scale-105"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                      }}
                      onClick={() => selectPreset("gradient", p.value)}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="h-10 w-12 p-1 cursor-pointer"
                      value={gradientColors?.from || "#0f172a"}
                      onChange={(e) => handleCustomGradientChange("from", e.target.value)}
                    />
                    <Input
                      type="text"
                      className="flex-1 font-mono text-xs uppercase"
                      value={gradientColors?.from || "#0f172a"}
                      onChange={(e) => handleCustomGradientChange("from", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>End Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="h-10 w-12 p-1 cursor-pointer"
                      value={gradientColors?.to || "#0369a1"}
                      onChange={(e) => handleCustomGradientChange("to", e.target.value)}
                    />
                    <Input
                      type="text"
                      className="flex-1 font-mono text-xs uppercase"
                      value={gradientColors?.to || "#0369a1"}
                      onChange={(e) => handleCustomGradientChange("to", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6">
          <Button onClick={saveTheme} disabled={loading || !isDirty} className="w-full">
            {loading ? "Saving draft..." : "Save Theme Draft"}
          </Button>
        </div>
      </div>

      {/* Interactive Mock Profile Live Preview */}
      <div className="flex items-center justify-center bg-slate-950 p-6 rounded-r-xl border-l border-border min-h-[350px]">
        <div className="w-full max-w-[280px] aspect-[9/16] rounded-[2rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col items-center p-4" style={previewBackgroundStyle}>
          
          {/* Top Notch */}
          <div className="absolute top-2 w-20 h-4 bg-slate-800 rounded-full z-10" />

          {/* Card Mockup */}
          <div className={`mt-8 w-full rounded-2xl p-4 flex flex-col items-center text-center ${previewCardStyle}`}>
            {/* Avatar */}
            {userImage ? (
              <img
                src={userImage}
                alt="Avatar"
                className={`w-14 h-14 rounded-full border-2 ${
                  themeType === "retro" ? "border-green-500" : themeType === "cyberpunk" ? "border-pink-500" : "border-cyan-500"
                }`}
              />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                themeType === "retro" ? "bg-black border-2 border-green-500" : "bg-cyan-500 text-slate-950"
              }`}>
                {(userName || "A").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="mt-2 font-bold text-sm truncate max-w-full">
              {userName || "Your Name"}
            </div>
            <div className="text-xs text-muted-foreground opacity-80">
              @preview
            </div>

            {userBio && (
              <div className="mt-2.5 text-xs opacity-90 line-clamp-2">
                {userBio}
              </div>
            )}

            {/* Mock Links */}
            <div className="mt-4 w-full space-y-1.5">
              {["github", "linkedin"].map((plat) => (
                <div
                  key={plat}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold capitalize border flex items-center justify-center gap-1.5 ${
                    themeType === "retro"
                      ? "border-green-500 bg-black text-green-500"
                      : themeType === "cyberpunk"
                      ? "border-cyan-500 bg-zinc-950 text-cyan-400"
                      : "border-border bg-slate-800/40 text-white"
                  }`}
                >
                  <span>🔗</span>
                  <span>{plat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
