import Link from "next/link";
import { SiGithub, SiX } from "@icons-pack/react-simple-icons";

export function Footer() {
    return (
        <footer className="border-t border-violet-200/60 bg-white/45 backdrop-blur-xl dark:border-white/10 dark:bg-black/10">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                  <Link2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-zinc-950 dark:text-white">
                  LinkID
                </span>
              </div>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                One identity. Infinite professional links. Built for developers
                who value clean, predictable URLs.
              </p>
              <div className="flex items-center gap-3">
                <FooterIcon
                  href="https://github.com/vishnukothakapu/linkid"
                  label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </FooterIcon>
                <FooterIcon href="https://discord.gg/Ng4q6quFcq" label="Discord">
                  <DiscordIcon className="h-5 w-5" />
                </FooterIcon>
                <FooterIcon
                  href="https://twitter.com/vishnukothakapu"
                  label="Twitter"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </FooterIcon>
              </div>
            </div>

            <FooterColumn
              title="Product"
              links={[
                ["Dashboard", "/dashboard"],
                ["Features", "#features"],
                ["Demo", "#demo"],
                ["Get Started", "/login"],
              ]}
            />
            <FooterColumn
              title="Support"
              links={[
                [
                  "Report Issue",
                  "https://github.com/vishnukothakapu/linkid/issues",
                ],
                [
                  "Community",
                  "https://github.com/vishnukothakapu/linkid/discussions",
                ],
                ["Documentation", "/documentation"],
                ["Contact Us", "/contact-us"],
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                ["About", "/about"],
                ["Privacy Policy", "/privacy"],
                ["Terms of Service", "/terms"],
                ["Status", "/status"],
              ]}
            />
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-violet-200/60 pt-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400 md:flex-row">
            <p>
              &copy; {new Date().getFullYear()} LinkID. Built by{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Vishnu Kothakapu
              </span>
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
    );
}

function FooterIcon({
  href,
  label,
  children,
}

function FooterColumn({
  title,
  links,
}
