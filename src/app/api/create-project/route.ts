import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { prompt, tasks, flowchart } = await req.json();

    if (!prompt || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Invalid project data" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ScopeAI");

    const project = {
      prompt,
      tasks,
      flowchart,
      createdAt: new Date(),
    };

    const result = await db.collection("projects").insertOne(project);

    return NextResponse.json({
      success: true,
      projectId: result.insertedId,
      message: "Project saved successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save project to database" },
      { status: 500 }
    );
  }
}
