"use client";

import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "What should I include in my support request?",
    answer:
      "Please provide as much detail as possible including: what you were trying to do, what happened instead, any error messages you received, your browser/device information, and steps to reproduce the issue. This helps our team resolve your issue faster.",
  },
  {
    id: "faq-2",
    question: "How quickly will I get a response?",
    answer:
      "We typically respond to all support requests within 24 hours during business days (Monday-Friday, 9am-5pm EST). For urgent issues, please mention it in your subject line and we'll prioritize accordingly.",
  },
  {
    id: "faq-3",
    question: "Can I contact support through other channels?",
    answer:
      "Yes! You can reach us via email at support@linkid.qzz.io, file an issue on our GitHub repository, or check our documentation for common questions. We also have a community Discord where you can get help from other users.",
  },
  {
    id: "faq-4",
    question: "Is my information secure when I submit a support request?",
    answer:
      "Absolutely. All support requests are encrypted and transmitted securely. We never share your personal information with third parties and only use it to help resolve your issue and improve our service.",
  },
  {
    id: "faq-5",
    question: "What if I don't hear back within 24 hours?",
    answer:
      "If you haven't received a response within 24 hours, please check your spam folder. You can also send a follow-up message or contact us directly at support@linkid.qzz.io with your original request details.",
  },
  {
    id: "faq-6",
    question: "Do you offer phone support?",
    answer:
      "Currently, we support inquiries through email, contact form, and our community channels. For complex issues, our team may request to schedule a brief call or video chat to better understand your problem.",
  },
];

export function ContactFAQ() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Record<string, HTMLButtonElement>>({});

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    itemId: string,
    index: number
  ) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        toggleItem(itemId);
        break;
      case "ArrowDown": {
        e.preventDefault();
        const nextIndex = index + 1;
        if (nextIndex < faqItems.length) {
          const nextId = faqItems[nextIndex].id;
          itemRefs.current[nextId]?.focus();
        }
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          const prevId = faqItems[prevIndex].id;
          itemRefs.current[prevId]?.focus();
        }
        break;
      }
      case "Home":
        e.preventDefault();
        itemRefs.current[faqItems[0].id]?.focus();
        break;
      case "End": {
        e.preventDefault();
        const lastId = faqItems[faqItems.length - 1].id;
        itemRefs.current[lastId]?.focus();
        break;
      }
      default:
        break;
    }
  };

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Find answers to common questions about our support process
        </p>
      </div>

      <div
        className="space-y-3"
        role="region"
        aria-label="Frequently asked questions"
      >
        {faqItems.map((item, index) => {
          const isExpanded = expanded.has(item.id);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border border-border bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-sm dark:border-border dark:bg-card/30"
            >
              <button
                ref={(el) => {
                  if (el) itemRefs.current[item.id] = el;
                }}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id, index)}
                aria-expanded={isExpanded}
                aria-controls={`${item.id}-content`}
                className="w-full px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background transition-colors"
              >
                <span className="font-semibold text-foreground text-sm sm:text-base pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isExpanded && (
                <div
                  id={`${item.id}-content`}
                  className="border-t border-border/50 bg-muted/20 px-4 py-4 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        💡 <span className="font-medium">Keyboard users:</span> Use Arrow Keys to navigate, Enter or Space to expand/collapse
      </p>
    </section>
  );
}
