"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  error: string | null;
  success: boolean;
}

export function ContactForm() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formState, setFormState] = useState<FormState>({
    status: "idle",
    error: null,
    success: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    description?: string;
  }>({});

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isSubmitting = formState.status === "submitting";
  const hasError = formState.status === "error";
  const hasSuccess = formState.status === "success";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState({ status: "submitting", error: null, success: false });
    setFieldErrors({});

    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const description = formData.description.trim();

    // Client-side validation
    const errors: typeof fieldErrors = {};
    if (!name) errors.name = "Name is required.";
    if (!email) errors.email = "Email is required.";
    if (!description) errors.description = "Message is required.";

    // Basic email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormState({
        status: "error",
        error: "Please fill in all required fields.",
        success: false,
      });
      return;
    }

    try {
      const response = await fetch("/api/contact-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, description }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Unable to send your message.");
      }

      setFormState({
        status: "success",
        error: null,
        success: true,
      });
      setFormData({ name: "", email: "", subject: "", description: "" });

      // Clear any existing timeout before creating a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset success state after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setFormState({ status: "idle", error: null, success: false });
      }, 5000);
    } catch (error) {
      setFormState({
        status: "error",
        error: error instanceof Error ? error.message : "Something went wrong. Please try again later.",
        success: false,
      });
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts editing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as keyof typeof fieldErrors];
        return updated;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Name and Email Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-foreground">
            Your Name <span className="text-destructive" aria-label="required">*</span>
          </label>
          <p id="name-description" className="text-xs text-muted-foreground">
            How should we address you?
          </p>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
            aria-describedby="name-description"
            aria-invalid={!!fieldErrors.name}
            disabled={isSubmitting}
            className="transition-colors"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-foreground">
            Email Address <span className="text-destructive" aria-label="required">*</span>
          </label>
          <p id="email-description" className="text-xs text-muted-foreground">
            We&apos;ll reply to this address
          </p>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            required
            aria-describedby="email-description"
            aria-invalid={!!fieldErrors.email}
            disabled={isSubmitting}
            className="transition-colors"
          />
        </div>
      </div>

      {/* Subject Field */}
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-semibold text-foreground">
          Subject <span className="text-muted-foreground text-xs font-normal">(optional)</span>
        </label>
        <p id="subject-description" className="text-xs text-muted-foreground">
          Brief topic of your message
        </p>
        <Input
          id="subject"
          name="subject"
          type="text"
          value={formData.subject}
          onChange={handleInputChange}
          placeholder="Account access issue, Feature request, etc."
          aria-describedby="subject-description"
          disabled={isSubmitting}
          className="transition-colors"
        />
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-semibold text-foreground">
          Message <span className="text-destructive" aria-label="required">*</span>
        </label>
        <p id="description-description" className="text-xs text-muted-foreground">
          Please provide as much detail as possible to help us assist you better
        </p>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your issue or inquiry in detail..."
          required
          aria-describedby="description-description"
          aria-invalid={!!fieldErrors.description}
          disabled={isSubmitting}
          className="transition-colors min-h-32"
        />
      </div>

      {/* Error Message */}
      {hasError && formState.error && (
        <div
          className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 dark:border-destructive/40 dark:bg-destructive/20"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/90">{formState.error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {hasSuccess && (
        <div
          className="flex gap-3 rounded-lg border border-chart-2/50 bg-chart-2/10 px-4 py-3 dark:border-chart-2/40 dark:bg-chart-2/20"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-chart-2 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-chart-2">Success!</p>
            <p className="text-sm text-chart-2/90">
              Your message was sent successfully. Our support team will respond within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || hasSuccess}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : hasSuccess ? (
            "Message sent!"
          ) : (
            "Send message"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center sm:text-right">
          Response typically within <span className="font-semibold">24 hours</span>
        </p>
      </div>
    </form>
  );
}
