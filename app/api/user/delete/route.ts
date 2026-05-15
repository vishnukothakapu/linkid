import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyOtp, clearOtp } from "@/lib/deleteOtpStore";
import { invalidateUserSessions } from "@/lib/sessionInvalidation";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { password, otp } = body as { password?: string; otp?: string };

    // Fetch user with password field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 1: Verify password for credential users
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 403 }
        );
      }
    }

    // Step 2: Verify OTP (mandatory for all users)
    if (!otp) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const otpVerification = verifyOtp(userId, otp);
    if (!otpVerification.valid) {
      return NextResponse.json(
        { error: otpVerification.error || "Invalid verification code" },
        { status: 400 }
      );
    }

    // Invalidate sessions on all devices BEFORE deleting
    invalidateUserSessions(userId);

    // All checks passed — delete user (cascade handles related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // Clean up OTP store
    clearOtp(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
