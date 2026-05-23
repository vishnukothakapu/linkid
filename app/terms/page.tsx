// app/terms/page.tsx
import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service | LinkID",
  description: "Terms of Service for LinkID platform - Usage guidelines, user responsibilities, and legal terms for our professional link management service",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative border-b border-violet-200/60 px-4 pb-12 pt-32 dark:border-white/10 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
              Last updated: May 20, 2026
            </p>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        {/* Content Section */}
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 sm:p-8 md:p-10">
            <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-950 dark:prose-headings:text-white prose-h1:text-3xl prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-white prose-li:text-zinc-600 dark:prose-li:text-zinc-300">
              
              <section>
                <h2>1. Introduction</h2>
                <p>
                  Welcome to <strong>LinkID</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our platform at{' '}
                  <Link href="/" className="text-violet-600 hover:text-violet-700 dark:text-violet-400">
                    linkid.qzz.io
                  </Link>
                  , you agree to comply with and be bound by these Terms of Service. Please read them carefully.
                </p>
                <p>
                  These terms apply to all users of the platform, including but not limited to visitors, registered users, and contributors.
                  If you disagree with any part of these terms, you may not access the platform.
                </p>
              </section>

              <section>
                <h2>2. Account Terms</h2>
                <p>To use LinkID, you agree that:</p>
                <ul>
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You are responsible for maintaining the security of your account and password</li>
                  <li>You must provide accurate, current, and complete registration information</li>
                  <li>You may not share your account credentials with any third party</li>
                  <li>You are solely responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>You may not use the service for any illegal or unauthorized purpose</li>
                </ul>
              </section>

              <section>
                <h2>3. Acceptable Use Policy</h2>
                <p>You agree <strong>NOT</strong> to use LinkID to:</p>
                <ul>
                  <li>Post, share, or promote illegal content or activities</li>
                  <li>Harass, abuse, defame, intimidate, or threaten others</li>
                  <li>Impersonate any person or entity or falsely state your affiliation</li>
                  <li>Distribute malware, viruses, or any harmful code</li>
                  <li>Circumvent any security features or access restrictions</li>
                  <li>Engage in any activity that disrupts or interferes with our services</li>
                  <li>Use automated scripts or bots to collect user information without consent</li>
                  <li>Share links to phishing sites, malicious content, or adult material</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2>4. User Content &amp; Responsibilities</h2>
                <div className="my-4 rounded-lg border border-violet-200/60 bg-violet-50/50 p-4 dark:border-violet-400/20 dark:bg-violet-400/5">
                  <p className="mb-2 font-semibold text-zinc-900 dark:text-white">Ownership</p>
                  <p className="mb-0">
                    You retain all ownership rights to the content you submit to LinkID, including profile information, 
                    links, and any other data. We do not claim ownership over your content.
                  </p>
                </div>
                <div className="my-4 rounded-lg border border-violet-200/60 bg-violet-50/50 p-4 dark:border-violet-400/20 dark:bg-violet-400/5">
                  <p className="mb-2 font-semibold text-zinc-900 dark:text-white">License to Use</p>
                  <p className="mb-0">
                    By submitting content, you grant LinkID a worldwide, non-exclusive, royalty-free license to host, 
                    store, display, and distribute your content as necessary to provide and improve our services.
                  </p>
                </div>
                <p>You are solely responsible for:</p>
                <ul>
                  <li>The accuracy, legality, and appropriateness of the links you share</li>
                  <li>Ensuring your content does not violate any third-party rights or intellectual property</li>
                  <li>Complying with all applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2>5. Platform Links &amp; Redirects</h2>
                <p>
                  LinkID provides shortcuts and redirects to external platforms and websites. We do not control, 
                  endorse, monitor, or assume responsibility for any content, privacy policies, or practices of 
                  any third-party websites or services.
                </p>
                <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <p className="mb-2 font-semibold text-amber-800 dark:text-amber-300">⚠️ Disclaimer</p>
                  <p className="mb-0 text-amber-700 dark:text-amber-400">
                    By using our redirect service, you acknowledge that: (1) We are not responsible for the content of external sites, 
                    (2) You access external websites entirely at your own risk, (3) We may update or remove redirect links at our discretion.
                  </p>
                </div>
              </section>

              <section>
                <h2>6. Intellectual Property</h2>
                <p>
                  The LinkID platform, including but not limited to its design, logo, source code, graphics, 
                  and user interface, is protected by copyright, trademark, and other intellectual property laws. 
                  You may not copy, modify, reverse engineer, or distribute any part of our platform without 
                  express written permission from LinkID.
                </p>
                <p>
                  LinkID, the LinkID logo, and all related names are trademarks of the LinkID project. 
                  Unauthorized use of these trademarks is prohibited.
                </p>
              </section>

              <section>
                <h2>7. Termination</h2>
                <p>
                  We reserve the right to suspend, disable, or terminate your account at our sole discretion, 
                  without prior notice or liability, for conduct that violates these terms, harms other users, 
                  or disrupts our platform.
                </p>
                <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                  <p className="mb-2 font-semibold text-red-800 dark:text-red-300">Upon termination:</p>
                  <ul className="mb-0 text-red-700 dark:text-red-400">
                    <li>Your right to use the platform will immediately cease</li>
                    <li>We may delete or deactivate your account and associated content</li>
                    <li>You may request permanent account deletion through your account settings</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2>8. Limitation of Liability</h2>
                <div className="my-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
                  <p className="mb-2 font-semibold text-zinc-900 dark:text-white">To the maximum extent permitted by applicable law:</p>
                  <p className="mb-0">
                    In no event shall LinkID, its contributors, maintainers, or affiliates be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, including without limitation, loss of 
                    profits, data, use, goodwill, or other intangible losses, resulting from your use or inability 
                    to use the platform.
                  </p>
                </div>
                <p className="text-sm italic">
                  <strong>Disclaimer of Warranties:</strong> LinkID is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; 
                  without warranties of any kind, either express or implied, including but not limited to warranties 
                  of merchantability, fitness for a particular purpose, title, or non-infringement.
                </p>
              </section>

              <section>
                <h2>9. Changes to Terms</h2>
                <p>
                  We may update these terms from time to time. We will notify users of significant changes by posting a 
                  notice on the platform or sending an email to registered users. Your continued use of LinkID after 
                  changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2>10. Contact Us</h2>
                <p>If you have any questions about these Terms of Service, please contact us:</p>
                <ul>
                  <li>
                    Through GitHub Issues:{' '}
                    <Link href="https://github.com/vishnukothakapu/linkid/issues" className="text-violet-600 hover:text-violet-700 dark:text-violet-400" target="_blank" rel="noopener noreferrer">
                      github.com/vishnukothakapu/linkid
                    </Link>
                  </li>
                  <li>
                    Via email:{' '}
                    <a href="mailto:support@linkid.qzz.io" className="text-violet-600 hover:text-violet-700 dark:text-violet-400">
                      support@linkid.qzz.io
                    </a>
                  </li>
                  <li>
                    Through GitHub Discussions:{' '}
                    <Link href="https://github.com/vishnukothakapu/linkid/discussions" className="text-violet-600 hover:text-violet-700 dark:text-violet-400" target="_blank" rel="noopener noreferrer">
                      GitHub Discussions
                    </Link>
                  </li>
                </ul>
              </section>
            </div>

            {/* Back to Home Link */}
            <div className="mt-12 border-t border-violet-200/60 pt-8 text-center dark:border-white/10">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
