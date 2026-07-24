import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: "Documentation | LinkID",
  description:
    "Official documentation for LinkID platform including architecture, authentication, features, and deployment.",
};

export default function DocumentationPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative border-b border-violet-200/60 px-4 pb-12 pt-32 dark:border-white/10 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />

          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl">
              LinkID Documentation
            </h1>

            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
              Everything you need to understand, build, and deploy LinkID.
            </p>

            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 sm:p-8 md:p-10">
            <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-950 dark:prose-headings:text-white">
              {/* Introduction */}
              <section className="mb-12">
                <h2>Introduction</h2>

                <p className="text-muted-foreground leading-relaxed">
                  LinkID is a modern link-in-bio platform that allows users to
                  create personalized profile pages with social links, avatars,
                  and authentication support.
                </p>
              </section>

              {/* Features */}
              <section className="mb-12">
                <h2>Core Features</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    "OAuth Authentication",
                    "Public User Profiles",
                    "Custom Social Links",
                    "Dark Mode Support",
                    "Cloud Avatar Uploads",
                    "Responsive UI",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="rounded-xl border border-violet-200/50 bg-violet-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <p className="font-medium">{feature}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tech Stack */}
              <section className="mb-12">
                <h2>Tech Stack</h2>

                <div className="overflow-hidden rounded-xl border border-violet-200/60 dark:border-white/10">
                  <table className="w-full border-collapse">
                    <thead className="bg-violet-100/60 dark:bg-white/[0.03]">
                      <tr>
                        <th className="border-b border-violet-200/60 px-4 py-3 text-left dark:border-white/10">
                          Technology
                        </th>
                        <th className="border-b border-violet-200/60 px-4 py-3 text-left dark:border-white/10">
                          Purpose
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td className="border-b border-violet-200/40 px-4 py-3 dark:border-white/10">
                          Next.js
                        </td>
                        <td className="border-b border-violet-200/40 px-4 py-3 dark:border-white/10">
                          Frontend Framework
                        </td>
                      </tr>

                      <tr>
                        <td className="border-b border-violet-200/40 px-4 py-3 dark:border-white/10">
                          Tailwind CSS
                        </td>
                        <td className="border-b border-violet-200/40 px-4 py-3 dark:border-white/10">
                          Styling System
                        </td>
                      </tr>

                      <tr>
                        <td className="border-b border-violet-200/40 px-4 py-3 dark:border-white/10">
                          PostgreSQL
                        </td>
                        <td className="border-b border-violet-200/40 px-4 py-3 dark:border-white/10">
                          Database
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3">NextAuth.js</td>

                        <td className="px-4 py-3">Authentication</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Authentication */}
              <section className="mb-12">
                <h2>Authentication</h2>

                <p className="text-muted-foreground leading-relaxed mb-4">
                  LinkID supports both OAuth providers and email/password
                  authentication.
                </p>

                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Google OAuth</li>
                  <li>GitHub OAuth</li>
                  <li>bcrypt password hashing</li>
                  <li>Secure session handling</li>
                </ul>
              </section>

              {/* Routing */}
              <section className="mb-12">
                <h2>Routing Structure</h2>

                <div className="rounded-xl bg-zinc-950 p-5 text-sm text-zinc-100 overflow-x-auto">
                  <pre>
                    {`/
/login
/register
/dashboard
/[username]
/settings
/documentation
`}
                  </pre>
                </div>
              </section>

              {/* Environment Variables */}
              <section className="mb-12">
                <h2>Environment Variables</h2>

                <div className="rounded-xl bg-zinc-950 p-5 text-sm text-zinc-100 overflow-x-auto">
                  <pre>
                    {`DATABASE_URL=
NEXTAUTH_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDINARY_URL=
`}
                  </pre>
                </div>
              </section>

              {/* Deployment */}
              <section className="mb-12">
                <h2>Deployment</h2>

                <p className="text-muted-foreground leading-relaxed">
                  LinkID is optimized for deployment on Vercel with PostgreSQL
                  and Cloudinary integrations.
                </p>
              </section>

              {/* Future Features */}
              <section className="mb-12">
                <h2>Future Improvements</h2>

                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Custom domains</li>
                  <li>QR code generation</li>
                  <li>Analytics dashboard</li>
                  <li>Theme customization</li>
                  <li>API access</li>
                </ul>
              </section>

              {/* Support */}
              <section>
                <h2>Support</h2>

                <p className="text-muted-foreground">
                  Need help? Contact us at{" "}
                  <a
                    href="mailto:support@linkid.qzz.io"
                    className="text-violet-600 hover:text-violet-700"
                  >
                    support@linkid.qzz.io
                  </a>
                </p>
              </section>
            </div>

            {/* Footer */}
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
