import Link from "next/link";
import { Metadata } from "next";
import { Navbar } from "@/app/components/Navbar";
import { 
  Link2, 
  Route, 
  Zap, 
  Shield, 
  Globe, 
  Users, 
  Rocket,
  Heart,
  Star,
  Code2,
  Github,
  Twitter
} from "lucide-react";

export const metadata: Metadata = {
  title: "About LinkID | Your Professional Identity Platform",
  description: "Learn about LinkID - The platform that simplifies your professional identity with clean, predictable links for every platform",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <section className="relative border-b border-violet-200/60 px-4 pb-16 pt-32 dark:border-white/10 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
          
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-200 mb-6">
              <Rocket className="h-4 w-4" />
              Our Story
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-5xl md:text-6xl">
              Your Professional Identity,
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"> Simplified</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
              LinkID helps developers, job seekers, and professionals share their online presence 
              with clean, memorable links.
            </p>
            <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-zinc-950 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                To empower every professional with a simple, unified digital identity
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 dark:from-violet-400/15 dark:to-indigo-400/10 dark:text-violet-200">
                    <Link2 className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Simplify</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Replace long, messy URLs with clean, professional links
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 dark:from-violet-400/15 dark:to-indigo-400/10 dark:text-violet-200">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Connect</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Bring all your professional platforms under one username
                </p>
              </div>
              
              <div className="text-center p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 dark:from-violet-400/15 dark:to-indigo-400/10 dark:text-violet-200">
                    <Rocket className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Grow</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Build your professional brand with a memorable presence
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16 bg-white/50 dark:bg-white/[0.02] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-zinc-950 dark:text-white mb-4">
                Why Choose LinkID?
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-300">
                Built for professionals who value clean, predictable links
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4 p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                    <Route className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Platform Routing</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Predictable links like /github, /linkedin, /leetcode for every professional platform you use.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">One-Time Setup</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Add links once. Share everywhere. Update anytime without breaking existing links.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Secure & Private</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    OAuth authentication with Google & GitHub. Your data stays secure and private.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200">
                    <Globe className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-white mb-2">Multi-Platform Support</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    GitHub, LinkedIn, LeetCode, YouTube, Twitter, and 10+ other platforms supported.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-zinc-950 dark:text-white mb-4">
              Built with Modern Tech
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8">
              We use the latest technologies to ensure fast, secure, and reliable performance
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma", "NextAuth.js"].map((tech) => (
                <span key={tech} className="px-4 py-2 rounded-full border border-violet-200/60 bg-white/70 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="px-4 py-16 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-white/5 dark:text-violet-200 mb-6">
              <Heart className="h-4 w-4" />
              Open Source
            </div>
            <h2 className="text-3xl font-bold text-zinc-950 dark:text-white mb-4">
              Built by the Community, for the Community
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-8">
              LinkID is open source and welcomes contributions from developers worldwide. 
              Join us in building the future of professional identity management.
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href="https://github.com/vishnukothakapu/linkid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-300"
              >
                <Github className="h-5 w-5" />
                Star on GitHub
              </a>
              <a 
                href="https://github.com/vishnukothakapu/linkid/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-violet-200/70 bg-white/70 text-zinc-700 font-semibold hover:bg-white/90 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 transition-all duration-300"
              >
                Contribute
              </a>
            </div>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center py-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
