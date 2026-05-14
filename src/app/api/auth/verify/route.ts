import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { signJwt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ScopeAI");

    // Find matching user
    const user = await db.collection("users").findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    // If already verified
    if (user.isVerified === true) {
      return NextResponse.json(
        { error: "This account is already verified." },
        { status: 400 }
      );
    }

    // Check code match
    if (user.verificationCode !== code.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(user.verificationExpires)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark user as verified & clean temporary fields
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { verificationCode: "", verificationExpires: "" },
      }
    );

    // Sign JWT session
    const token = await signJwt({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully!",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

    // Set HttpOnly session cookie
    response.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
