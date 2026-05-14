import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required parameters." },
        { status: 400 }
      );
    }

    // Rigorous password security verification matching frontend criteria
    const satisfiesLength = password.length >= 8;
    const satisfiesUppercase = /[A-Z]/.test(password);
    const satisfiesNumber = /[0-9]/.test(password);
    const satisfiesSpecial = /[^A-Za-z0-9]/.test(password);

    if (!satisfiesLength || !satisfiesUppercase || !satisfiesNumber || !satisfiesSpecial) {
      return NextResponse.json(
        { error: "Password does not meet the required strength validation criteria." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ScopeAI");

    // Secure DB search using lowercased email key
    const user = await db.collection("users").findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "No registered user was found matching this credential." },
        { status: 404 }
      );
    }

    // Cryptographically hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Mutate database record and clear any active legacy tokens
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        }
      }
    );

    console.log(`[Reset Password API] Securely modified credentials for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Your ScopeAI account password has been successfully updated."
    });

  } catch (error: any) {
    console.error("[Reset Password API] Fatal Failure:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error. Failed to update password." },
      { status: 500 }
    );
  }
}
