import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { signJwt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ScopeAI");

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Block unverified login attempts
    if (user.isVerified === false) {
      return NextResponse.json(
        { 
          unverified: true, 
          email: user.email, 
          error: "Your email is not verified. Please enter the verification code." 
        },
        { status: 403 }
      );
    }

    const token = await signJwt({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

    // Calculate Cookie Expiry based on rememberMe
    const maxAge = rememberMe 
      ? 60 * 60 * 24 * 30 // 30 days
      : 60 * 60 * 24 * 1;  // 1 day

    // Set HttpOnly Cookie
    response.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
