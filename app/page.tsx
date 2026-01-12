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
} from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <>
      <Navbar />

     
      <section className="relative overflow-hidden">
        
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-32 text-center">
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

          <div className="mt-12 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">Create your LinkID</Link>
            </Button>

            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      <section className="py-28 bg-muted/40" id="features">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Why developers love LinkID
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for resumes, forms, and professional workflows.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3" >
            <FeatureCard
              icon={<Link2 className="h-6 w-6" />}
              title="Resume-friendly links"
              desc="Short, readable URLs that look clean and professional on resumes."
            />

            <FeatureCard
              icon={<Route className="h-6 w-6" />}
              title="Platform-specific routing"
              desc="Predictable links like /github, /linkedin, /leetcode."
            />

            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="One-time setup"
              desc="Add links once. Share everywhere. Update anytime."
            />
          </div>
        </div>
      </section>

   
      <section className="py-28" id="demo">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-center text-foreground">
            Clean links. Everywhere.
          </h2>
          <p className="mt-3 text-muted-foreground text-center">
            One username. Predictable links for every platform.
          </p>

          <div className="mt-12 space-y-4">
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

      <section className="py-24 text-center bg-muted/40" id="how">
        <h2 className="text-3xl font-bold text-foreground">
          Your professional identity, simplified.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Create your LinkID in under a minute.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LinkID — Built for developers & job seekers
      </footer>
    </>
  );
}

// components

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
    <div className="rounded-2xl border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-2 text-foreground">
        {title}
      </h3>

      <p className="text-muted-foreground leading-relaxed">
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
    <div className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 transition hover:bg-muted">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2 text-foreground">
          {icon}
        </div>
        <span className="font-medium text-foreground">{label}</span>
      </div>

      <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
        {url}
        <ArrowUpRight className="h-4 w-4 opacity-50" />
      </div>
    </div>
  );
}
