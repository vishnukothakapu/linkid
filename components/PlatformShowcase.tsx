"use client";

import { PLATFORM_ICONS, PLATFORM_NAMES } from "@/lib/platformIcons";
import { SectionHeader } from "@/components/SectionHeader";

export default function PlatformShowcase() {
  const platforms = Object.entries(PLATFORM_ICONS);

  // Duplicate array for seamless scrolling
  const marqueePlatforms = [...platforms, ...platforms];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <SectionHeader
            eyebrow="Supported Platforms"
            title="Platform compatibility made simple"
            desc="LinkID supports a wide range of platforms, making it easy to connect your online presence in one place."
          />
        </div>

        <div className="relative overflow-hidden">
          <div className="marquee flex w-max gap-6">
            {marqueePlatforms.map(([name, Icon], index) => (
              <div
                key={`${name}-${index}`}
                className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm"
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">
                  {PLATFORM_NAMES[name] ?? name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
