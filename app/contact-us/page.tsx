"use client";

import Link from "next/link";
import { Navbar } from "@/app/components/Navbar";
import { ContactForm } from "@/components/ContactForm";
import { ContactFAQ } from "@/components/ContactFAQ";
import { ContactTrustSignals } from "@/components/ContactTrustSignals";
import { SupportMethodsSection } from "@/components/SupportMethodsSection";
import { Separator } from "@/components/ui/separator";

export default function ContactUsPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-3 text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Contact Support
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Get in Touch
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground">
              Have a question or issue? Our dedicated support team is here to help. We respond to all inquiries within 24 hours.
            </p>
          </div>

          {/* Trust Signals */}
          <ContactTrustSignals />
        </section>

        <Separator className="mx-auto max-w-4xl my-12 sm:my-16" />

        {/* Contact Form Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-8 shadow-lg shadow-black/5 dark:border-border dark:bg-card dark:shadow-black/10">
            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Send us a Message
              </h2>
              <p className="text-sm text-muted-foreground">
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>

        <Separator className="mx-auto max-w-4xl my-12 sm:my-16" />

        {/* Support Methods Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <SupportMethodsSection />
        </section>

        <Separator className="mx-auto max-w-4xl my-12 sm:my-16" />

        {/* FAQ Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <ContactFAQ />
        </section>

        {/* Footer CTA */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 sm:p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Still need help?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our documentation or join our community on Discord for additional resources and support.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-center">
              <Link
                href="/documentation"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Documentation
              </Link>
              <a
                href="https://discord.gg/linkid"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Join Community Discord ↗
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
