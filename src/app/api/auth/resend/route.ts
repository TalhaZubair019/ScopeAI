import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to resend code" },
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

    if (user.isVerified === true) {
      return NextResponse.json(
        { error: "Account is already verified." },
        { status: 400 }
      );
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update the DB record
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          verificationCode,
          verificationExpires,
        }
      }
    );

    // Send the new email
    await sendVerificationEmail(user.email, verificationCode);

    return NextResponse.json({
      success: true,
      message: "A new verification code has been sent to your inbox.",
    });
  } catch (error) {
    console.error("Resend API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
