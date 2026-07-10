import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const handler = async (req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) => {
  let rememberMe = false;
  const pathname = req.nextUrl.pathname;

  if (req.method === "POST" && pathname.endsWith("/signin/credentials")) {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const clone = req.clone();
        const body = await clone.json();
        rememberMe = body.rememberMe === "true" || body.rememberMe === true;
      } else {
        const clone = req.clone();
        const formData = await clone.formData();
        rememberMe = formData.get("rememberMe") === "true";
      }

      const cookieStore = await cookies();
      cookieStore.set("remember-me", rememberMe ? "true" : "false", {
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    } catch (e) {
      console.error("Error parsing form data in auth wrapper:", e);
    }
  } else if (pathname.includes("/callback/")) {
    // Default OAuth logins to be remembered (30 days)
    rememberMe = true;
    const cookieStore = await cookies();
    cookieStore.set("remember-me", "true", {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  } else if (req.method === "POST" && pathname.endsWith("/signout")) {
    const cookieStore = await cookies();
    cookieStore.delete("remember-me");
  } else {
    const cookieStore = await cookies();
    rememberMe = cookieStore.get("remember-me")?.value === "true";
  }

  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  return NextAuth(req, ctx, {
    ...authOptions,
    session: {
      ...authOptions.session,
      maxAge,
    },
  });
};

export { handler as GET, handler as POST };
