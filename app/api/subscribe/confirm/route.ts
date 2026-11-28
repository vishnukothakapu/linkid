import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { confirmSubscription } from "@/lib/subscriberConsent";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";

  if (!token) {
    return new NextResponse(renderHtml("Error", "Confirmation token is missing.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const result = await confirmSubscription(prisma, token);

  if (!result.success) {
    const errorMsg =
      result.error === "TOKEN_ALREADY_USED"
        ? "This confirmation token has already been used and cannot reactivate consent."
        : "Invalid or expired confirmation link.";
    return new NextResponse(renderHtml("Confirmation Failed", errorMsg, false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const message = result.alreadyConfirmed
    ? "Your subscription is already confirmed."
    : "Thank you! Your email subscription has been confirmed.";

  // If client prefers JSON (e.g. API callers), return JSON
  if (req.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true, message, alreadyConfirmed: Boolean(result.alreadyConfirmed) });
  }

  return new NextResponse(renderHtml("Subscription Confirmed", message, true), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || req.nextUrl.searchParams.get("token") || "";

    if (!token) {
      return NextResponse.json({ error: "Confirmation token is required" }, { status: 400 });
    }

    const result = await confirmSubscription(prisma, token);

    if (!result.success) {
      const errorMsg =
        result.error === "TOKEN_ALREADY_USED"
          ? "This confirmation token has already been used and cannot reactivate consent."
          : "Invalid or expired confirmation link.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.alreadyConfirmed
        ? "Your subscription is already confirmed."
        : "Your subscription has been successfully confirmed.",
      alreadyConfirmed: Boolean(result.alreadyConfirmed),
    });
  } catch (err) {
    console.error("Subscription confirmation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function renderHtml(title: string, message: string, success: boolean): string {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "✓" : "✕";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — LinkID</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; max-width: 440px; width: 100%; padding: 36px 28px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .icon { width: 56px; height: 56px; border-radius: 50%; background: ${color}15; color: ${color}; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    h1 { font-size: 20px; color: #111827; margin: 0 0 10px; font-weight: 700; }
    p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 24px; }
    a.btn { display: inline-block; background: #7c3aed; color: white; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/" class="btn">Return to LinkID</a>
  </div>
</body>
</html>`;
}
