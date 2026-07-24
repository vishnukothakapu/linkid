"use client";

import { Clock, Shield, Users } from "lucide-react";

export function ContactTrustSignals() {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {/* Response Time Card */}
      <div className="rounded-lg border border-border bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 backdrop-blur-sm dark:border-border dark:from-blue-500/5 dark:to-blue-600/10">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/40">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">Quick Response Time</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              We typically respond to all support requests within <span className="font-medium text-foreground">24 hours</span> during business days.
            </p>
          </div>
        </div>
      </div>

      {/* Support Availability Card */}
      <div className="rounded-lg border border-border bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 backdrop-blur-sm dark:border-border dark:from-emerald-500/5 dark:to-emerald-600/10">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/40">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">Dedicated Support Team</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Available <span className="font-medium text-foreground">Monday–Friday</span>, 9am–5pm EST. Community support available 24/7.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Privacy Card */}
      <div className="rounded-lg border border-border bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 backdrop-blur-sm dark:border-border dark:from-amber-500/5 dark:to-amber-600/10">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/40">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">Secure & Private</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              All requests are encrypted and your data is <span className="font-medium text-foreground">never shared</span> with third parties.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
