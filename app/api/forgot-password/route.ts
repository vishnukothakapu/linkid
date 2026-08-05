import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 },
      );
    }
    console.log("Password reset requested for:", email);

    return NextResponse.json({
      message: "If the email exists, reset link sent.",
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
