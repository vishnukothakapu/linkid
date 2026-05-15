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
  Github,
  Linkedin,
  Code2,
  ArrowUpRight,
  Wand2,
  User,
  BarChart3,
  Globe,
  Moon,
  Shield,
} from "lucide-react";
import React from "react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden min-h-screen flex items-center md:min-h-[unset]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            One identity.
            <br />
            <span className="text-muted-foreground">
              Infinite professional links.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Stop pasting long URLs everywhere.
            <br />
            Share clean, predictable links like:
          </p>

          <div className="mt-4 inline-block rounded-lg border bg-muted px-4 py-2 font-mono text-sm text-muted-foreground">
            linkid.qzz.io/username/github
          </div>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">Create your LinkID</Link>
            </Button>

            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-28 bg-muted/40" id="features">
        <div className="mx-auto max-w-7xl px-6">
          {/* Stats Section */}
          <div className="mb-16 md:mb-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10+</div>
                <div className="text-sm md:text-base text-muted-foreground">Platforms Supported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">∞</div>
                <div className="text-sm md:text-base text-muted-foreground">Custom Links</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1min</div>
                <div className="text-sm md:text-base text-muted-foreground">Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm md:text-base text-muted-foreground">Free Forever</div>
              </div>
            </div>
          </div>

          <div className="mb-14 md:mb-20 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Why developers love LinkID
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for developers, job seekers, and professionals who value clean, predictable links.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Link2 className="h-5 w-5 md:h-6 md:w-6" />}
              title="Resume-friendly links"
              desc="Short, readable URLs that look clean and professional on resumes and portfolios."
            />

            <FeatureCard
              icon={<Route className="h-5 w-5 md:h-6 md:w-6" />}
              title="Platform routing"
              desc="Predictable links like /github, /linkedin, /leetcode for every professional platform."
            />

            <FeatureCard
              icon={<Zap className="h-5 w-5 md:h-6 md:w-6" />}
              title="One-time setup"
              desc="Add links once. Share everywhere. Update anytime without breaking existing links."
            />

            <FeatureCard
              icon={<Wand2 className="h-5 w-5 md:h-6 md:w-6" />}
              title="Auto platform detection"
              desc="Paste any URL and LinkID automatically detects the platform and formats it correctly."
            />

            <FeatureCard
              icon={<User className="h-5 w-5 md:h-6 md:w-6" />}
              title="Public profile page"
              desc="Shareable profile at linkid.qzz.io/username showcasing all your professional links."
            />

            <FeatureCard
              icon={<BarChart3 className="h-5 w-5 md:h-6 md:w-6" />}
              title="Real-time dashboard"
              desc="Add, edit, and delete links instantly with a responsive, intuitive interface."
            />

            <FeatureCard
              icon={<Globe className="h-5 w-5 md:h-6 md:w-6" />}
              title="Multi-platform support"
              desc="GitHub, LinkedIn, LeetCode, YouTube, Twitter, and 10+ other platforms supported."
            />

            <FeatureCard
              icon={<Moon className="h-5 w-5 md:h-6 md:w-6" />}
              title="Dark mode ready"
              desc="Full system theme support with light and dark modes for comfortable viewing."
            />

            <FeatureCard
              icon={<Shield className="h-5 w-5 md:h-6 md:w-6" />}
              title="Secure & private"
              desc="OAuth authentication with Google & GitHub. Your data stays secure and private."
            />
          </div>
        </div>
      </section>


      <section className="py-24 md:py-28" id="demo">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
            Clean links. Everywhere.
          </h2>
          <p className="mt-3 text-muted-foreground text-center">
            One username. Predictable links for every platform.
          </p>

          <div className="mt-10 space-y-4">
            <DemoRow
              icon={<Github className="h-5 w-5" />}
              label="GitHub"
              url="linkid.qzz.io/vishnu/github"
            />
            <DemoRow
              icon={<Linkedin className="h-5 w-5" />}
              label="LinkedIn"
              url="linkid.qzz.io/vishnu/linkedin"
            />
            <DemoRow
              icon={<Code2 className="h-5 w-5" />}
              label="LeetCode"
              url="linkid.qzz.io/vishnu/leetcode"
            />
          </div>
        </div>
      </section>

      <section
        id="how"
        className="bg-muted/40 px-4 py-16 sm:px-6 md:py-24 text-center"
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
            Your professional identity, simplified.
          </h2>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
            Create your LinkID in under a minute.
          </p>

          <div className="mt-6 sm:mt-8">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">LinkID</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                One identity. Infinite professional links. Built for developers who value clean, predictable URLs.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com/your-repo"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-5 w-5" />
                </Link>
                <Link
                  href="https://twitter.com/your-handle"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <div className="space-y-3">
                <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="#features" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
                <Link href="#demo" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Demo
                </Link>
                <Link href="/login" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Support Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Support</h3>
              <div className="space-y-3">
                <Link href="https://github.com/your-repo/issues" target="_blank" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Report Issue
                </Link>
                <Link href="https://github.com/your-repo/discussions" target="_blank" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Community
                </Link>
                <Link href="/docs" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </Link>
                <Link href="mailto:support@linkid.qzz.io" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Company Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <div className="space-y-3">
                <Link href="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link href="/status" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Status
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} LinkID. Built with ❤️ by{" "}
                <span className="font-medium text-foreground">Vishnu Kothakapu</span>
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Secure & Private
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  100% Free
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      <div className="mb-4 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      <h3 className="text-lg md:text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>

      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function DemoRow({
  icon,
  label,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  url: string;
}) {
  return (
    <Link
      href={`https://${url}`}
      target="_blank"
      className="block"
    >
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 sm:px-5 py-4 transition hover:bg-muted hover:shadow-sm active:scale-[0.98]">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2 text-foreground">
            {icon}
          </div>
          <span className="font-medium text-foreground">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-muted-foreground">
          {url}
          <ArrowUpRight className="h-4 w-4 opacity-50" />
        </div>
      </div>
    </Link>
  );
}
