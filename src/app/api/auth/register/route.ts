import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields (name, email, password) are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ScopeAI");

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isVerified === false) {
        return NextResponse.json(
          {
            unverified: true,
            email: existingUser.email,
            error: "This email is registered but not verified yet."
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      isVerified: false,
      verificationCode,
      verificationExpires,
    };

    await db.collection("users").insertOne(newUser);

    // Send dispatch email asynchronously (don't await block, or do await for deterministic feedback)
    await sendVerificationEmail(newUser.email, verificationCode);

    // Do not set cookies here; wait until they confirm code
    return NextResponse.json({
      success: true,
      unverified: true,
      email: newUser.email,
      message: "Verification code dispatched to email.",
    });
  } catch (error) {
    console.error("Registration API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
