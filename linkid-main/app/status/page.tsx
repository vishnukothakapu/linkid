// app/status/page.tsx
import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Status | LinkID",
  description: "Current operational status of all LinkID services.",
};

type ServiceStatus = "operational" | "degraded" | "outage";

const services: { name: string; status: ServiceStatus }[] = [
  { name: "Web Application", status: "operational" },
  { name: "Authentication (NextAuth)", status: "operational" },
  { name: "Database (PostgreSQL)", status: "operational" },
  { name: "API Routes", status: "operational" },
  { name: "Profile Redirects", status: "operational" },
];

const statusConfig: Record<ServiceStatus, { label: string; dot: string; badge: string }> = {
  operational: {
    label: "Operational",
    dot: "bg-green-500",
    badge: "border-green-200 bg-green-50/80 text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300",
  },
  degraded: {
    label: "Degraded Performance",
    dot: "bg-yellow-500",
    badge: "border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300",
  },
  outage: {
    label: "Outage",
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50/80 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300",
  },
};

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <section
          className="relative overflow-hidden border-b border-violet-200/60 px-4 pb-14 pt-28 dark:border-white/10 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8"
          aria-labelledby="status-heading"
        >
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-violet-200/60 bg-violet-100/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
              System Status
            </p>
            <h1
              id="status-heading"
              className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl"
            >
              Service Status
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Current operational status of all LinkID services and infrastructure.
            </p>
            <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
            <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">

              <div className={cn(
                "mb-10 flex items-center gap-3 rounded-2xl border p-5",
                allOperational
                  ? "border-green-200 bg-green-50/80 dark:border-green-800 dark:bg-green-950/20"
                  : "border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20"
              )}>
                <span className={cn("h-3 w-3 flex-shrink-0 rounded-full", allOperational ? "bg-green-500" : "bg-yellow-500")} />
                <p className={cn("font-semibold text-sm", allOperational ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300")}>
                  {allOperational ? "All systems are fully operational." : "Some systems are experiencing issues."}
                </p>
              </div>
              <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400">
                Note: This status page currently displays default values and is not yet connected to live health checks. For real incident reports, please use the GitHub link below.
              </p>

              <div className="divide-y divide-zinc-200/70 overflow-hidden rounded-2xl border border-zinc-200/70 dark:divide-white/10 dark:border-white/10">
              
                {services.map((service) => {
                  const cfg = statusConfig[service.status];
                  return (
                    <div key={service.name} className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{service.name}</span>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400">
                To report an incident, open an issue on{" "}
                <Link href="https://github.com/vishnukothakapu/linkid/issues" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline dark:text-violet-400">
                  GitHub
                </Link>.
              </p>

              <div className="mt-14 border-t border-violet-200/60 pt-8 dark:border-white/10">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-600 transition-colors hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:text-zinc-400 dark:hover:text-violet-400 dark:focus:ring-offset-zinc-950"
                >
                  <span aria-hidden="true">←</span>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
