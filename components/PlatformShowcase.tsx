import { PLATFORM_ICONS } from "@/lib/platformIcons";

export default function PlatformShowcase() {
  const platforms = Object.entries(PLATFORM_ICONS);

  // Duplicate array for seamless scrolling
  const marqueePlatforms = [...platforms, ...platforms];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">
            Multiple Supported Platforms
          </h2>
            <p className="mt-4 text-lg text-muted-foreground">
                LinkID supports a wide range of platforms, making it easy to connect your online presence in one place.            </p>
        </div>

        <div className="relative overflow-hidden">
            <div className="marquee flex w-max gap-6">
            {marqueePlatforms.map(([name, Icon], index) => (
              <div
                key={`${name}-${index}`}
                className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm"
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm capitalize">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}