import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | LinkID",
  description: "Privacy Policy for LinkID - How we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <section
          className="relative overflow-hidden border-b border-violet-200/60 px-4 pb-14 pt-28 dark:border-white/10 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8"
          aria-labelledby="privacy-heading"
        >
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-violet-200/60 bg-violet-100/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
              Legal
            </p>
            <h1
              id="privacy-heading"
              className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl"
            >
              Privacy Policy
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              How we collect, use, and protect your personal information when you use LinkID.
            </p>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Last updated: June 2026</p>
            <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
            <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 space-y-10">
              
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">1. Information We Collect</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  When you create a LinkID account, we collect your name, email address, and —
                  if you sign in via OAuth — a profile picture provided by the OAuth provider
                  (Google or GitHub). We also store the platform links you voluntarily add to
                  your profile.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">2. How We Use Your Information</h2>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-zinc-600 dark:text-zinc-300">To create and display your public profile page</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-zinc-600 dark:text-zinc-300">To authenticate you securely via NextAuth.js</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-zinc-600 dark:text-zinc-300">To send transactional emails if you reset your password</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-zinc-600 dark:text-zinc-300">To improve the platform based on aggregate, anonymised usage patterns</span>
                  </li>
                </ul>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">3. Data Storage</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  All data is stored in a PostgreSQL database. Passwords are hashed with{" "}
                  <strong className="text-zinc-900 dark:text-white">bcrypt</strong> and are never stored in plain text. OAuth tokens are
                  managed by NextAuth.js and are not persisted beyond your session.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">4. Data Sharing</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  We do not sell, rent, or share your personal data with third parties for
                  marketing purposes. Your public profile data (username and links) is visible
                  to anyone who visits your LinkID URL — this is the core function of the service.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">5. Cookies</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  LinkID uses a single session cookie managed by NextAuth.js to keep you logged
                  in. No advertising or tracking cookies are used.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">6. Your Rights</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  You may delete your account and all associated data at any time from your
                  dashboard settings. For any other data requests, please open an issue on our{" "}
                  <a href="https://github.com/vishnukothakapu/linkid/issues" target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
                    GitHub repository
                  </a>
                  .
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">7. Changes to This Policy</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  We may update this policy occasionally. Significant changes will be announced
                  via the repository&apos;s changelog or platform notices. Continued use of
                  LinkID after updates constitutes acceptance of the revised policy.
                </p>
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
