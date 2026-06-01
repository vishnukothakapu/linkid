"use client";

import Link from "next/link";
import { Mail, Github, FileText, MessageSquare } from "lucide-react";

const supportMethods = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Direct contact with our support team",
    href: "mailto:support@linkid.qzz.io",
    label: "support@linkid.qzz.io",
    external: true,
  },
  {
    icon: Github,
    title: "GitHub Issues",
    description: "Report bugs and request features",
    href: "https://github.com/linkid/linkid/issues",
    label: "Open an issue",
    external: true,
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Browse our guides and tutorials",
    href: "/documentation",
    label: "View docs",
    external: false,
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Chat with other users on Discord",
    href: "https://discord.gg/linkid",
    label: "Join Discord",
    external: true,
  },
];

export function SupportMethodsSection() {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Other Ways to Get Help
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re here to support you through multiple channels
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {supportMethods.map((method) => {
          const Icon = method.icon;
          const isExternal = method.external;

          return (
            <Link
              key={method.title}
              href={method.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              aria-label={isExternal ? `${method.title} (opens in a new tab)` : undefined}
              className="group rounded-lg border border-border bg-card/50 p-6 transition-all hover:border-ring hover:bg-card hover:shadow-md dark:border-border dark:bg-card/30 dark:hover:shadow-lg dark:hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold text-foreground group-hover:text-ring transition-colors">
                      {method.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {method.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <span className="text-xs font-medium text-primary/80 group-hover:text-primary transition-colors flex items-center gap-1">
                  {method.label}
                  {isExternal && (
                    <span className="text-[10px]" aria-hidden="true">
                      ↗
                    </span>
                  )}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pro tip:</span> For urgent issues, mention &quot;URGENT&quot; in the subject line and we&apos;ll prioritize your request.
        </p>
      </div>
    </section>
  );
}
