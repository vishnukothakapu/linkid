import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | LinkID",
  description:
    "Terms of Service for LinkID platform - Usage guidelines, user responsibilities, and legal terms for our professional link management service",
};

function InfoCard({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "warning" | "danger" | "neutral";
}) {
  const variants = {
    default:
      "border-violet-200/60 bg-violet-50/70 dark:border-violet-400/20 dark:bg-violet-400/5",
    warning:
      "border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20",
    danger:
      "border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-950/20",
    neutral:
      "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/50",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm backdrop-blur-sm ${variants[variant]}`}
    >
      <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>

      <div className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <section
          className="relative overflow-hidden border-b border-violet-200/60 px-4 pb-14 pt-28 dark:border-white/10 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8"
          aria-labelledby="terms-heading"
        >
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-violet-200/60 bg-violet-100/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300">
              Legal
            </p>

            <h1
              id="terms-heading"
              className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl"
            >
              Terms of Service
            </h1>

            <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Please read these terms carefully before using LinkID. They
              outline your rights, responsibilities, and acceptable use of the
              platform.
            </p>

            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Last updated: May 20, 2026
            </p>

            <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
            <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 space-y-10">

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">1. Introduction</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Welcome to <strong className="text-zinc-900 dark:text-white">LinkID</strong> (&quot;we,&quot;
                  &quot;our,&quot; or &quot;us&quot;). By accessing or using
                  our platform at <Link href="/" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">linkid.qzz.io</Link>, you
                  agree to comply with and be bound by these Terms of Service.
                </p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  These terms apply to all users of the platform, including
                  visitors, registered users, and contributors. If you do not
                  agree with any part of these terms, you may not access or
                  use the platform.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">2. Account Terms</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">To use LinkID, you agree that:</p>
                <ul className="space-y-3">
                  {[
                    "You must be at least 13 years old to create an account",
                    "You are responsible for maintaining the security of your account and password",
                    "You must provide accurate, current, and complete registration information",
                    "You may not share your account credentials with any third party",
                    "You are solely responsible for all activities under your account",
                    "You must notify us immediately of unauthorized account use",
                    "You may not use the service for illegal or unauthorized purposes"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">3. Acceptable Use Policy</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">You agree not to use LinkID to:</p>
                <ul className="space-y-3">
                  {[
                    "Post, share, or promote illegal content or activities",
                    "Harass, abuse, intimidate, threaten, or defame others",
                    "Impersonate any person or entity or misrepresent your affiliation",
                    "Distribute malware, viruses, or harmful software",
                    "Circumvent security measures or access restrictions",
                    "Interfere with or disrupt platform functionality",
                    "Use bots or automated scripts to collect user data without consent",
                    "Share phishing links, malicious content, or adult material",
                    "Violate applicable laws or regulations"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">4. User Content & Responsibilities</h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard title="Ownership">
                    <p className="m-0">
                      You retain ownership rights to the content you submit,
                      including profile information, links, and associated data.
                    </p>
                  </InfoCard>

                  <InfoCard title="License to Use">
                    <p className="m-0">
                      By submitting content, you grant LinkID a worldwide,
                      non-exclusive, royalty-free license to host, store,
                      display, and distribute your content as necessary to
                      operate the platform.
                    </p>
                  </InfoCard>
                </div>

                <p className="pt-2 text-zinc-600 dark:text-zinc-300 leading-relaxed">You are solely responsible for:</p>
                <ul className="space-y-3">
                  {[
                    "The accuracy, legality, and appropriateness of shared links",
                    "Ensuring your content does not violate third-party rights",
                    "Complying with all applicable laws and regulations"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">5. Platform Links & Redirects</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  LinkID may provide redirects to third-party platforms and
                  websites. We do not control or assume responsibility for the
                  content, policies, or practices of external services.
                </p>
                <InfoCard title="Disclaimer" variant="warning">
                  <p className="m-0">
                    By using our redirect service, you acknowledge that
                    external websites are accessed at your own risk and may be
                    modified or removed without notice.
                  </p>
                </InfoCard>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">6. Intellectual Property</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  The LinkID platform, including its design, branding, source
                  code, graphics, and interface elements, is protected by
                  intellectual property laws.
                </p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  You may not copy, modify, reverse engineer, distribute, or
                  reproduce any part of the platform without written permission.
                </p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  LinkID and related branding assets are trademarks of the
                  LinkID project. Unauthorized use is prohibited.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">7. Termination</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  We reserve the right to suspend or terminate accounts that
                  violate these terms, harm users, or disrupt the platform.
                </p>
                <InfoCard title="Upon termination" variant="danger">
                  <ul className="mb-0 mt-0 space-y-2">
                    <li className="flex gap-2 items-start">
                      <span className="text-red-500">•</span>
                      <span>Your access to the platform may immediately cease</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-red-500">•</span>
                      <span>We may delete or deactivate associated account data</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-red-500">•</span>
                      <span>You may request permanent account deletion through account settings</span>
                    </li>
                  </ul>
                </InfoCard>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">8. Limitation of Liability</h2>
                <InfoCard title="Limitation of Liability" variant="neutral">
                  <p className="m-0">
                    To the maximum extent permitted by law, LinkID and its
                    contributors shall not be liable for indirect, incidental,
                    special, consequential, or punitive damages resulting from
                    platform use.
                  </p>
                </InfoCard>
                <p className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 px-4 py-4 text-sm leading-7 italic dark:border-zinc-700 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-300">
                  <strong className="text-zinc-900 dark:text-white not-italic">Disclaimer of Warranties:</strong> LinkID is
                  provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;
                  without warranties of any kind, express or implied.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">9. Changes to Terms</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  We may update these terms periodically. Significant updates
                  may be communicated through platform notices or email
                  notifications.
                </p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Continued use of LinkID after updates constitutes acceptance
                  of the revised terms.
                </p>
              </section>

              <hr className="border-zinc-200/70 dark:border-white/10" />

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">10. Contact Us</h2>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  If you have questions about these Terms of Service, contact
                  us through any of the following channels:
                </p>

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                  <li className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                    <a href="https://github.com/vishnukothakapu/linkid/issues" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-900 hover:underline dark:text-white">
                      GitHub Issues
                    </a>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Report a bug or request a feature.</p>
                  </li>
                  <li className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                    <a href="mailto:support@linkid.qzz.io" className="font-semibold text-zinc-900 hover:underline dark:text-white">
                      support@linkid.qzz.io
                    </a>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Email us for general inquiries.</p>
                  </li>
                  <li className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/50 p-5 dark:border-white/5 dark:bg-white/[0.01]">
                    <a href="https://github.com/vishnukothakapu/linkid/discussions" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-900 hover:underline dark:text-white">
                      GitHub Discussions
                    </a>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Join the community conversation.</p>
                  </li>
                </ul>
              </section>

              {/* Footer Navigation */}
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
