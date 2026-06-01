// app/terms/page.tsx
import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service | LinkID",
  description:
    "Terms of Service for LinkID platform - Usage guidelines, user responsibilities, and legal terms for our professional link management service",
};

const sectionClass =
  "space-y-4 border-b border-zinc-200/70 pb-10 last:border-none last:pb-0 dark:border-white/10";

const cardClass =
  "rounded-2xl border border-violet-200/60 bg-violet-50/70 p-5 shadow-sm backdrop-blur-sm dark:border-violet-400/20 dark:bg-violet-400/5";

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
      className={cn(
        "rounded-2xl border p-5 shadow-sm backdrop-blur-sm",
        variants[variant],
      )}
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
        {/* Hero Section */}
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

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20">
            <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12">
              <div
                className={cn(
                  "prose prose-zinc max-w-none dark:prose-invert",
                  "prose-headings:scroll-mt-24",
                  "prose-h2:mb-4 prose-h2:mt-0 prose-h2:text-2xl prose-h2:font-bold",
                  "prose-p:text-zinc-600 dark:prose-p:text-zinc-300",
                  "prose-p:leading-8",
                  "prose-li:text-zinc-600 dark:prose-li:text-zinc-300",
                  "prose-li:leading-7",
                  "prose-strong:text-zinc-900 dark:prose-strong:text-white",
                  "prose-a:text-violet-600 dark:prose-a:text-violet-400",
                  "prose-a:no-underline hover:prose-a:underline",
                )}
              >
                <section
                  className={sectionClass}
                  aria-labelledby="introduction"
                >
                  <h2 id="introduction">1. Introduction</h2>

                  <p>
                    Welcome to <strong>LinkID</strong> (&quot;we,&quot;
                    &quot;our,&quot; or &quot;us&quot;). By accessing or using
                    our platform at <Link href="/">linkid.qzz.io</Link>, you
                    agree to comply with and be bound by these Terms of Service.
                  </p>

                  <p>
                    These terms apply to all users of the platform, including
                    visitors, registered users, and contributors. If you do not
                    agree with any part of these terms, you may not access or
                    use the platform.
                  </p>
                </section>

                <section
                  className={sectionClass}
                  aria-labelledby="account-terms"
                >
                  <h2 id="account-terms">2. Account Terms</h2>

                  <p>To use LinkID, you agree that:</p>

                  <ul className="space-y-2">
                    <li>
                      You must be at least 13 years old to create an account
                    </li>
                    <li>
                      You are responsible for maintaining the security of your
                      account and password
                    </li>
                    <li>
                      You must provide accurate, current, and complete
                      registration information
                    </li>
                    <li>
                      You may not share your account credentials with any third
                      party
                    </li>
                    <li>
                      You are solely responsible for all activities under your
                      account
                    </li>
                    <li>
                      You must notify us immediately of unauthorized account use
                    </li>
                    <li>
                      You may not use the service for illegal or unauthorized
                      purposes
                    </li>
                  </ul>
                </section>

                <section
                  className={sectionClass}
                  aria-labelledby="acceptable-use"
                >
                  <h2 id="acceptable-use">3. Acceptable Use Policy</h2>

                  <p>You agree not to use LinkID to:</p>

                  <ul className="space-y-2">
                    <li>
                      Post, share, or promote illegal content or activities
                    </li>
                    <li>
                      Harass, abuse, intimidate, threaten, or defame others
                    </li>
                    <li>
                      Impersonate any person or entity or misrepresent your
                      affiliation
                    </li>
                    <li>Distribute malware, viruses, or harmful software</li>
                    <li>Circumvent security measures or access restrictions</li>
                    <li>Interfere with or disrupt platform functionality</li>
                    <li>
                      Use bots or automated scripts to collect user data without
                      consent
                    </li>
                    <li>
                      Share phishing links, malicious content, or adult material
                    </li>
                    <li>Violate applicable laws or regulations</li>
                  </ul>
                </section>

                <section
                  className={sectionClass}
                  aria-labelledby="user-content"
                >
                  <h2 id="user-content">
                    4. User Content &amp; Responsibilities
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard title="Ownership">
                      <p className="m-0">
                        You retain ownership rights to the content you submit,
                        including profile information, links, and associated
                        data.
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

                  <p>You are solely responsible for:</p>

                  <ul className="space-y-2">
                    <li>
                      The accuracy, legality, and appropriateness of shared
                      links
                    </li>
                    <li>
                      Ensuring your content does not violate third-party rights
                    </li>
                    <li>Complying with all applicable laws and regulations</li>
                  </ul>
                </section>

                <section className={sectionClass} aria-labelledby="redirects">
                  <h2 id="redirects">5. Platform Links &amp; Redirects</h2>

                  <p>
                    LinkID may provide redirects to third-party platforms and
                    websites. We do not control or assume responsibility for the
                    content, policies, or practices of external services.
                  </p>

                  <InfoCard title="⚠️ Disclaimer" variant="warning">
                    <p className="m-0">
                      By using our redirect service, you acknowledge that
                      external websites are accessed at your own risk and may be
                      modified or removed without notice.
                    </p>
                  </InfoCard>
                </section>

                <section
                  className={sectionClass}
                  aria-labelledby="intellectual-property"
                >
                  <h2 id="intellectual-property">6. Intellectual Property</h2>

                  <p>
                    The LinkID platform, including its design, branding, source
                    code, graphics, and interface elements, is protected by
                    intellectual property laws.
                  </p>

                  <p>
                    You may not copy, modify, reverse engineer, distribute, or
                    reproduce any part of the platform without written
                    permission.
                  </p>

                  <p>
                    LinkID and related branding assets are trademarks of the
                    LinkID project. Unauthorized use is prohibited.
                  </p>
                </section>

                <section className={sectionClass} aria-labelledby="termination">
                  <h2 id="termination">7. Termination</h2>

                  <p>
                    We reserve the right to suspend or terminate accounts that
                    violate these terms, harm users, or disrupt the platform.
                  </p>

                  <InfoCard title="Upon termination" variant="danger">
                    <ul className="mb-0 mt-0 space-y-2">
                      <li>Your access to the platform may immediately cease</li>
                      <li>
                        We may delete or deactivate associated account data
                      </li>
                      <li>
                        You may request permanent account deletion through
                        account settings
                      </li>
                    </ul>
                  </InfoCard>
                </section>

                <section className={sectionClass} aria-labelledby="liability">
                  <h2 id="liability">8. Limitation of Liability</h2>

                  <InfoCard title="Limitation of Liability" variant="neutral">
                    <p className="m-0">
                      To the maximum extent permitted by law, LinkID and its
                      contributors shall not be liable for indirect, incidental,
                      special, consequential, or punitive damages resulting from
                      platform use.
                    </p>
                  </InfoCard>

                  <p className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 px-4 py-4 text-sm leading-7 italic dark:border-zinc-700 dark:bg-zinc-900/40">
                    <strong>Disclaimer of Warranties:</strong> LinkID is
                    provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;
                    without warranties of any kind, express or implied.
                  </p>
                </section>

                <section className={sectionClass} aria-labelledby="changes">
                  <h2 id="changes">9. Changes to Terms</h2>

                  <p>
                    We may update these terms periodically. Significant updates
                    may be communicated through platform notices or email
                    notifications.
                  </p>

                  <p>
                    Continued use of LinkID after updates constitutes acceptance
                    of the revised terms.
                  </p>
                </section>

                <section className="space-y-4" aria-labelledby="contact">
                  <h2 id="contact">10. Contact Us</h2>

                  <p>
                    If you have questions about these Terms of Service, contact
                    us through any of the following channels:
                  </p>

                  <ul className="space-y-3">
                    <li>
                      GitHub Issues:{" "}
                      <Link
                        href="https://github.com/vishnukothakapu/linkid/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        github.com/vishnukothakapu/linkid/issues
                      </Link>
                    </li>

                    <li>
                      Email:{" "}
                      <a href="mailto:support@linkid.qzz.io">
                        support@linkid.qzz.io
                      </a>
                    </li>

                    <li>
                      GitHub Discussions:{" "}
                      <Link
                        href="https://github.com/vishnukothakapu/linkid/discussions"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub Discussions
                      </Link>
                    </li>
                  </ul>
                </section>
              </div>

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
