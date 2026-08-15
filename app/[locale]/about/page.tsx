// app/about/page.tsx
import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About | LinkID",
  description:
    "Learn about LinkID - the open-source professional link management platform that gives you one username and clean, predictable links for every platform.",
};

const sectionClass =
  "space-y-4 border-b border-zinc-200/70 pb-10 last:border-none last:pb-0 dark:border-white/10";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("About");
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
              {t("badge")}
            </p>
            <h1
              id="about-heading"
              className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl"
            >
              {t("title")}
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              {t("description")}
            </p>
            <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

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
                <section className={sectionClass} aria-labelledby="what-is">
                  <h2 id="what-is">{t("whatIsTitle")}</h2>
                  <p>{t("whatIsP1")}</p>
                  <p>
                    {t.rich("whatIsP2", {
                      github: (chunks) => <code>linkid.qzz.io/username/github</code>,
                      linkedin: (chunks) => <code>linkid.qzz.io/username/linkedin</code>
                    })}
                  </p>
                </section>

                <section className={sectionClass} aria-labelledby="features">
                  <h2 id="features">{t("featuresTitle")}</h2>
                  <ul className="space-y-2">
                    <li>{t("f1")}</li>
                    <li>{t("f2")}</li>
                    <li>{t("f3")}</li>
                    <li>{t("f4")}</li>
                    <li>{t("f5")}</li>
                    <li>{t("f6")}</li>
                    <li>{t("f7")}</li>
                  </ul>
                </section>

                <section className={sectionClass} aria-labelledby="open-source">
                  <h2 id="open-source">{t("openSourceTitle")}</h2>
                  <p>
                    {t.rich("openSourceP1", {
                      license: (chunks) => <strong>MIT License</strong>
                    })}
                  </p>
                  <ul className="space-y-3">
                    <li>
                      {t("github")}{" "}
                      <Link href="https://github.com/vishnukothakapu/linkid" target="_blank" rel="noopener noreferrer">
                        github.com/vishnukothakapu/linkid
                      </Link>
                    </li>
                    <li>
                      {t("contributingGuide")}{" "}
                      <Link href="https://github.com/vishnukothakapu/linkid/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
                        CONTRIBUTING.md
                      </Link>
                    </li>
                  </ul>
                </section>

                <section className="space-y-4" aria-labelledby="contact">
                  <h2 id="contact">{t("contactTitle")}</h2>
                  <p>{t("contactP1")}</p>
                  <ul className="space-y-3">
                    <li>
                      {t("githubIssues")}{" "}
                      <Link href="https://github.com/vishnukothakapu/linkid/issues" target="_blank" rel="noopener noreferrer">
                        github.com/vishnukothakapu/linkid/issues
                      </Link>
                    </li>
                    <li>{t("email")} <a href="mailto:support@linkid.qzz.io">support@linkid.qzz.io</a></li>
                    <li>
                      {t("githubDiscussions")}{" "}
                      <Link href="https://github.com/vishnukothakapu/linkid/discussions" target="_blank" rel="noopener noreferrer">
                        GitHub Discussions
                      </Link>
                    </li>
                  </ul>
                </section>
              </div>

              <div className="mt-14 border-t border-violet-200/60 pt-8 dark:border-white/10">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-600 transition-colors hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:text-zinc-400 dark:hover:text-violet-400 dark:focus:ring-offset-zinc-950"
                >
                  <span aria-hidden="true">←</span>
                  {t("back")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
