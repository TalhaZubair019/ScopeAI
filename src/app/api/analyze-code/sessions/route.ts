import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { CodeAuditSession } from "@/lib/types";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("ScopeAI");

    const sessions = await db
      .collection("audit_sessions")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionData: Partial<CodeAuditSession> = await req.json();
    const client = await clientPromise;
    const db = client.db("ScopeAI");

    const { _id, ...updateData } = sessionData;
    
    // Set timestamps
    const now = new Date();
    if (!_id) {
      updateData.createdAt = now;
    }
    updateData.updatedAt = now;

    if (_id) {
      const result = await db.collection("audit_sessions").updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      
      return NextResponse.json({ _id, ...updateData });
    } else {
      const result = await db.collection("audit_sessions").insertOne(updateData);
      return NextResponse.json({ _id: result.insertedId, ...updateData });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save audit session" },
      { status: 500 }
    );
  }
}
