import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sendResetPasswordEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ScopeAI");

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    // Get the application host dynamically from headers
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";

    // Construct absolute URL targeting /reset-password
    const resetUrl = `${proto}://${host}/reset-password?email=${encodeURIComponent(user.email)}`;

    // Trigger the Resend email utility
    const emailSent = await sendResetPasswordEmail(user.email, resetUrl);

    if (!emailSent) {
      throw new Error("Failed to transmit email.");
    }

    return NextResponse.json({
      success: true,
      message: "A password reset link has been successfully sent to your email address."
    });

  } catch (error: any) {
    console.error("[Forgot Password API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
