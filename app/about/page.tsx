import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { cn } from "@/lib/utils";
import {
  Globe,
  Wand2,
  BarChart3,
  Shield,
  User,
  Moon,
  Github,
  Code2,
  MessageSquare,
  Mail,
  Users
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | LinkID",
  description:
    "Learn about LinkID - the open-source professional link management platform that gives you one username and clean, predictable links for every platform.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <section
          className="relative overflow-hidden border-b border-violet-200/60 px-4 pb-14 pt-28 dark:border-white/10 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8"
          aria-labelledby="about-heading"
        >
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-violet-200/60 bg-violet-100/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
              About
            </p>
            <h1
              id="about-heading"
              className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl"
            >
              About LinkID
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Your professional identity, simplified. One username. Clean,
              predictable links for every platform.
            </p>
            <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
            <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 space-y-12">

              {/* What is LinkID? */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">What is LinkID?</h2>
                <div className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <p>
                    <strong className="text-zinc-900 dark:text-white">LinkID</strong> is a free, open-source link management platform built
                    for developers and professionals. Instead of pasting long, forgettable URLs
                    across every platform, you get one clean username and predictable links for
                    every profile you own.
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-200/60 bg-violet-50/50 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
                  <p className="text-base text-zinc-700 dark:text-zinc-300">
                    Share <code className="rounded-md border border-violet-100 bg-white/80 px-1.5 py-0.5 font-mono text-sm font-semibold text-violet-700 shadow-sm dark:border-white/10 dark:bg-black/40 dark:text-violet-300">linkid.qzz.io/username/github</code> or{" "}
                    <code className="rounded-md border border-violet-100 bg-white/80 px-1.5 py-0.5 font-mono text-sm font-semibold text-violet-700 shadow-sm dark:border-white/10 dark:bg-black/40 dark:text-violet-300">linkid.qzz.io/username/linkedin</code> and anyone who clicks it lands
                    exactly where you want them, every time.
                  </p>
                </div>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              {/* Features */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">Features</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FeatureItem icon={<Globe className="h-5 w-5" />} title="One username across platforms" desc="GitHub, LinkedIn, LeetCode, YouTube, and more." />
                  <FeatureItem icon={<Wand2 className="h-5 w-5" />} title="Auto platform detection" desc="Paste any URL and the platform is identified instantly." />
                  <FeatureItem icon={<BarChart3 className="h-5 w-5" />} title="Real-time dashboard" desc="Instant add, edit, and delete management." />
                  <FeatureItem icon={<Shield className="h-5 w-5" />} title="Secure authentication" desc="OAuth login via Google & GitHub, plus email/password auth." />
                  <FeatureItem icon={<User className="h-5 w-5" />} title="Public profile page" desc="Shareable anywhere with a beautiful UI." />
                  <FeatureItem icon={<Moon className="h-5 w-5" />} title="Dark & Light mode" desc="Full system theme support for comfortable viewing." />
                </div>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              {/* Open Source */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">Open Source</h2>
                <p className="text-zinc-600 dark:text-zinc-300">
                  LinkID is built entirely in the open under the <strong className="text-zinc-900 dark:text-white">MIT License</strong>.
                  Contributions, bug reports, and feature requests are always welcome.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <a href="https://github.com/vishnukothakapu/linkid" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-white/[0.02] dark:hover:border-violet-500/50">
                    <Github className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-white">GitHub Repository</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">View source code</div>
                    </div>
                  </a>
                  <a href="https://github.com/vishnukothakapu/linkid/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white/60 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-white/[0.02] dark:hover:border-violet-500/50">
                    <Code2 className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-white">Contributing Guide</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">How to contribute</div>
                    </div>
                  </a>
                </div>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              {/* Get in Touch */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">Get in Touch</h2>
                <p className="text-zinc-600 dark:text-zinc-300">Have questions, ideas, or want to contribute? Reach out through any of the following:</p>
                <ul className="grid gap-4 sm:grid-cols-3">
                  <li className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <a href="https://github.com/vishnukothakapu/linkid/issues" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-900 hover:underline dark:text-white">
                        GitHub Issues
                      </a>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Report a bug or request a feature.</p>
                    </div>
                  </li>
                  <li className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <a href="mailto:support@linkid.qzz.io" className="font-semibold text-zinc-900 hover:underline dark:text-white">
                        support@linkid.qzz.io
                      </a>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Email us for general inquiries.</p>
                    </div>
                  </li>
                  <li className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <a href="https://github.com/vishnukothakapu/linkid/discussions" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-900 hover:underline dark:text-white">
                        GitHub Discussions
                      </a>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Join the community conversation.</p>
                    </div>
                  </li>
                </ul>
              </section>

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

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-violet-100/50 bg-white/40 p-4 transition-colors hover:bg-white/60 dark:border-white/5 dark:bg-white/[0.01] dark:hover:bg-white/[0.03]">
      <div className="mt-1 flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shadow-sm dark:bg-violet-900/30 dark:text-violet-400">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
      </div>
    </div>
  );
}
