import { Navbar } from "@/app/components/Navbar";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import {
  Link2,
  Route,
  Zap,
  Wand2,
  User,
  BarChart3,
  Globe,
  Moon,
  Shield,
  CheckCircle2,
  ArrowUpRight,
  Github,
  Linkedin,
  Code2,
} from "lucide-react";
import React from "react";

const stats = [
  { value: "10+", label: "Platforms Supported" },
  { value: "Unlimited", label: "Custom Links" },
  { value: "1 min", label: "Setup Time" },
  { value: "Free", label: "For Everyone" },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  // Split into two arrays if you want an asynchronous double-row marquee feel, 
  // or keep it in one loop. Here all features are passed cleanly into the marquee track rows.
  const featuresList = [
    { icon: <Link2 className="h-5 w-5" />, title: "Resume-friendly links", desc: "Short, readable URLs that look clean and professional on resumes and portfolios." },
    { icon: <Route className="h-5 w-5" />, title: "Platform routing", desc: "Predictable links like /github, /linkedin, /leetcode for every professional platform." },
    { icon: <Zap className="h-5 w-5" />, title: "One-time setup", desc: "Add links once. Share everywhere. Update anytime without breaking existing links." },
    { icon: <Wand2 className="h-5 w-5" />, title: "Auto platform detection", desc: "Paste any URL and LinkID automatically detects the platform and formats it correctly." },
    { icon: <User className="h-5 w-5" />, title: "Public profile page", desc: "Shareable profile at linkid.qzz.io/username showcasing all your professional links." },
    { icon: <BarChart3 className="h-5 w-5" />, title: "Real-time dashboard", desc: "Add, edit, and delete links instantly with a responsive, intuitive interface." },
    { icon: <Globe className="h-5 w-5" />, title: "Multi-platform support", desc: "GitHub, LinkedIn, LeetCode, YouTube, Twitter, and 10+ other platforms supported." },
    { icon: <Moon className="h-5 w-5" />, title: "Dark mode ready", desc: "Full system theme support with light and dark modes for comfortable viewing." },
    { icon: <Shield className="h-5 w-5" />, title: "Secure & private", desc: "OAuth authentication with Google & GitHub. Your data stays secure and private." },
  ];

  return (
    <>
      <Navbar />

      <main className="overflow-hidden">
        {/* Hero Section */}
        <section className="relative flex min-h-screen items-center border-b border-violet-200/60 px-4 pb-16 pt-32 dark:border-white/10 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-violet-200/70 via-indigo-100/40 to-transparent blur-2xl dark:from-violet-700/20 dark:via-indigo-700/10" />

          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.06fr_0.94fr]">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-200">
                <SparkDot />
                Professional link management
              </div>

              <h1 className="text-4xl font-black leading-[1.04] tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
                One identity for every professional link.
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg lg:mx-0">
                Stop pasting long URLs everywhere. Share clean, predictable
                links for GitHub, LinkedIn, portfolios, resumes, and more.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                <Button
                  size="lg"
                  asChild
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-6 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-500/30 sm:w-auto"
                >
                  <Link href="/login">Create your LinkID</Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full rounded-xl border-violet-200/70 bg-white/60 px-7 py-6 text-base font-semibold shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white/90 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:w-auto"
                >
                  <a href="#demo">View Demo</a>
                </Button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:flex-row sm:justify-center lg:justify-start">
                <ProofItem>OAuth-ready</ProofItem>
                <ProofItem>Dark mode</ProofItem>
                <ProofItem>Resume-friendly URLs</ProofItem>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute inset-x-8 -top-6 -z-10 h-32 bg-gradient-to-r from-violet-500/25 via-indigo-500/20 to-blue-500/20 blur-3xl" />
              <div className="rounded-3xl border border-white/70 bg-white/75 p-3 shadow-2xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-black/30">
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/70 p-5 dark:border-white/10 dark:from-zinc-900 dark:to-indigo-950/30 sm:p-6">
                  <div className="flex items-center justify-between gap-4 border-b border-violet-100 pb-4 dark:border-white/10">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        linkid.qzz.io/vishnu
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Public profile preview
                      </p>
                    </div>
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                      Live
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <PreviewLink icon={<Github className="h-4 w-4" />} label="GitHub" path="/github" />
                    <PreviewLink icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" path="/linkedin" />
                    <PreviewLink icon={<Code2 className="h-4 w-4" />} label="LeetCode" path="/leetcode" />
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-100 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Share one clean identity
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    </div>
                    <p className="mt-2 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                      linkid.qzz.io/username/github
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </section>

        {/* Features Section (Marquee Implemented Here) */}
        {/* Features Section */}
        <section className="relative overflow-hidden py-16 md:py-24" id="features">
          <SectionWash />
          <div className="px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Features"
              title="Why developers love LinkID"
              desc="Built for developers, job seekers, and professionals who value clean, predictable links."
            />
          </div>

          {/* Marquee Container Outer Wrapper */}
          <div className="relative mt-16 flex flex-col gap-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,transparent_5%,black_20%,black_80%,transparent_95%,transparent)]">

            {/* Row 1: Moving Track (Inlined keyframes) */}
            <div className="marquee flex w-max gap-5">
              {/* Original List */}
              {featuresList.map((feat, index) => (
                <div key={`r1-${index}`} className="w-[350px] shrink-0">
                  <FeatureCard icon={feat.icon} title={feat.title} desc={feat.desc} />
                </div>
              ))}
              {/* Duplicated List */}
              {featuresList.map((feat, index) => (
                <div key={`r1-dup-${index}`} className="w-[350px] shrink-0">
                  <FeatureCard icon={feat.icon} title={feat.title} desc={feat.desc} />
                </div>
              ))}
            </div>

            {/* Row 2: Reverse Moving Track (Inlined keyframes) */}
            <div className="marquee-reverse flex w-max gap-5">
              {/* Original List */}
              {[...featuresList].reverse().map((feat, index) => (
                <div key={`r2-${index}`} className="w-[350px] shrink-0">
                  <FeatureCard icon={feat.icon} title={feat.title} desc={feat.desc} />
                </div>
              ))}
              {/* Duplicated List */}
              {[...featuresList].reverse().map((feat, index) => (
                <div key={`r2-dup-${index}`} className="w-[350px] shrink-0">
                  <FeatureCard icon={feat.icon} title={feat.title} desc={feat.desc} />
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Demo Section */}
        <section className="relative px-4 py-16 sm:px-6 md:py-24 lg:px-8" id="demo">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.86fr_1.14fr]">
            <SectionHeader
              align="left"
              eyebrow="Demo"
              title="Clean links. Everywhere."
              desc="One username gives you predictable links for every platform your audience already knows."
            />

            <div className="rounded-3xl border border-white/70 bg-white/70 p-3 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
              <div className="space-y-3 rounded-2xl border border-violet-100/80 bg-white/80 p-4 dark:border-white/10 dark:bg-zinc-950/70 sm:p-5">
                <DemoRow icon={<Github className="h-5 w-5" />} label="GitHub" url="linkid.qzz.io/vishnu/github" />
                <DemoRow icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" url="linkid.qzz.io/vishnu/linkedin" />
                <DemoRow icon={<Code2 className="h-5 w-5" />} label="LeetCode" url="linkid.qzz.io/vishnu/leetcode" />
              </div>
            </div>
          </div>
        </section>

        {/* Call To Action */}
        <section className="relative px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8" id="how">
          <div className="absolute inset-x-0 top-1/2 -z-10 h-44 -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-200/45 to-transparent blur-3xl dark:via-violet-500/10" />
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/70 bg-white/70 px-6 py-12 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 sm:px-10">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Your professional identity, simplified.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Create your LinkID in under a minute and share one memorable URL everywhere.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                asChild
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-500/30"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-violet-200/60 bg-white/45 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                  <Link2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-zinc-950 dark:text-white">LinkID</span>
              </div>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                One identity. Infinite professional links. Built for developers who value clean, predictable URLs.
              </p>
              <div className="flex items-center gap-3">
                <FooterIcon href="https://github.com/your-repo" label="GitHub">
                  <Github className="h-5 w-5" />
                </FooterIcon>
                <FooterIcon href="https://twitter.com/your-handle" label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </FooterIcon>
              </div>
            </div>

            <FooterColumn title="Product" links={[
              ["Dashboard", "/dashboard"],
              ["Features", "#features"],
              ["Demo", "#demo"],
              ["Get Started", "/login"],
            ]} />
            <FooterColumn title="Support" links={[
              ["Report Issue", "https://github.com/your-repo/issues"],
              ["Community", "https://github.com/your-repo/discussions"],
              ["Documentation", "/docs"],
              ["Contact Us", "mailto:support@linkid.qzz.io"],
            ]} />
            <FooterColumn title="Company" links={[
              ["About", "/about"],
              ["Privacy Policy", "/privacy"],
              ["Terms of Service", "/terms"],
              ["Status", "/status"],
            ]} />
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-violet-200/60 pt-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400 md:flex-row">
            <p>
              &copy; {new Date().getFullYear()} LinkID. Built by{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Vishnu Kothakapu</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                Secure & Private
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                100% Free
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// Subcomponents definitions remain exactly identical
function SparkDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-600 dark:bg-violet-300" />
    </span>
  );
}

function ProofItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
      {children}
    </span>
  );
}

function PreviewLink({ icon, label, path }: { icon: React.ReactNode; label: string; path: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
          {icon}
        </div>
        <span className="font-medium text-zinc-800 dark:text-zinc-100">{label}</span>
      </div>
      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{path}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/65 p-5 text-center shadow-lg shadow-violet-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-950/10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
      <div className="text-2xl font-black tracking-tight text-violet-700 dark:text-violet-200 sm:text-3xl">
        {value}
      </div>
      <div className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 sm:text-sm">
        {label}
      </div>
    </div>
  );
}

function SectionWash() {
  return (
    <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-white/50 to-transparent dark:from-white/[0.03]" />
  );
}

function SectionHeader({ eyebrow, title, desc, align = "center" }: { eyebrow: string; title: string; desc: string; align?: "left" | "center" }) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`max-w-2xl ${alignment}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
        {desc}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-6 shadow-lg shadow-violet-950/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:bg-white/90 hover:shadow-xl hover:shadow-violet-950/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-violet-300/30 dark:hover:bg-white/[0.07]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:from-violet-400/15 dark:to-indigo-400/10 dark:text-violet-200">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-zinc-950 transition-colors duration-300 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-200">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {desc}
      </p>
    </div>
  );
}

function DemoRow({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <Link href={`https://${url}`} target="_blank" className="group block">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-white/80 px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 transition-colors duration-300 group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-400/10 dark:text-violet-200">
            {icon}
          </div>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {label}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
          <span className="truncate">{url}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600 group-hover:opacity-100 dark:group-hover:text-violet-300" />
        </div>
      </div>
    </Link>
  );
}

function FooterIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/70 bg-white/60 text-zinc-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:text-violet-200"
    >
      {children}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</h3>
      <div className="space-y-3">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="block text-sm text-zinc-600 transition-colors duration-300 hover:text-violet-700 dark:text-zinc-400 dark:hover:text-violet-200"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}