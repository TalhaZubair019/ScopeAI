import { NextRequest, NextResponse } from "next/server";
import { Task } from "@/lib/types";

export const runtime = "edge";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { prompt, startDate, skipWeekends } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY in environment" },
        { status: 500 }
      );
    }

    let currentStartDate = startDate || new Date().toISOString().split("T")[0];

    // If skipWeekends is enabled, ensure the initial start date is not a weekend
    if (skipWeekends) {
      const dateObj = new Date(currentStartDate);
      const day = dateObj.getUTCDay(); // 0 = Sunday, 6 = Saturday
      if (day === 0) {
        // Sunday -> Move to Monday
        dateObj.setUTCDate(dateObj.getUTCDate() + 1);
        currentStartDate = dateObj.toISOString().split("T")[0];
      } else if (day === 6) {
        // Saturday -> Move to Monday
        dateObj.setUTCDate(dateObj.getUTCDate() + 2);
        currentStartDate = dateObj.toISOString().split("T")[0];
      }
    }

    const systemPrompt = `
      You are an expert AI project planner.
      Your goal is to transform a user's high-level or detailed vision into a sequence of actionable sub-tasks.
      
      IMPORTANT: You MUST incorporate every specific detail, requirement, technical stack, or constraint mentioned in the user's input.
      If the user provides a long description, use it as a detailed project spec to ensure the generated tasks are highly relevant and accurate to their specific needs.
      
      SCHEDULING LOGIC:
      - Start Date: ${currentStartDate}
      - Skip Weekends: ${skipWeekends ? "ENABLED (Only Monday-Friday allowed)" : "DISABLED (7-day week)"}
      
      If Skip Weekends is ENABLED, you MUST NOT assign any task a due_date that falls on a Saturday or Sunday. If a task would naturally fall on a weekend, push it to the next Monday.

      FLOWCHART INSTRUCTION:
      Generate a HIGHLY DETAILED technical Mermaid.js flowchart (graph TD) that visualizes the architectural and systemic flow of the system described. 
      Use SIMPLE AND CLEAR wording for all node labels so they are easy to understand. Avoid overly complex jargon.
      Break the diagram into logical clusters/layers (e.g., [User Interface], [Server API], [Business Logic], [Database], [Cloud Services]).
      Include specific technology nodes based on the user's requirements (e.g., [Next.js], [Database Storage]).
      Use decision diamonds for logic gates (e.g., {Logged In?}) and ensure the flowchart captures the implementation flow.
      
      SYNTAX RULES:
      - Use standard Mermaid 10.x syntax.
      - For labeled arrows, use: A -->|Label Text| B (NOT A -->|Label Text|> B).
      - Ensure node IDs (if used) are simple alphanumeric strings; use brackets for labels with spaces: e.g., Node1[Text with Spaces].
      - For subgraphs, always use double quotes for the title: subgraph "Title Name" (NOT subgraph [Title Name]).
      - Every subgraph MUST end with a newline followed by the literal keyword 'end' on its own line. (NOT endsubgraph).
      - Avoid special characters like parentheses or brackets inside node labels unless properly quoted if necessary.

      For each task, provide:
      1. task_name: A concise title (max 5-7 words).
      2. description: A single-sentence but clear explanation.
      3. due_date: A calculated due date in "YYYY-MM-DD" format, starting from ${currentStartDate} and progressing logically.
      4. duration: A realistic estimate of the time required (e.g., "2 days", "1 week", "4 months").

      Follow this JSON format:
      {
        "tasks": [
          {
            "task_name": "Project Initiation",
            "description": "Define the project scope and set up the development environment.",
            "due_date": "${currentStartDate}",
            "duration": "2 days"
          },
          ...
        ],
        "flowchart": "graph TD\n  A[Frontend] --> B[API Gateway]\n  B --> C[Database]"
      }
    `;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // High performance model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }, // Enforce JSON if supported by model/API
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate tasks from AI provider" },
        { status: 502 }
      );
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Sometimes LLMs wrap JSON in markdown blocks
    if (content.startsWith("```json")) {
      content = content.replace(/```json\n?/, "").replace(/```$/, "");
    }

    try {
      const parsed = JSON.parse(content);

      // Auto-fix common Mermaid syntax hallucinations (e.g., |Text|> B instead of |Text| B)
      if (parsed.flowchart) {
        parsed.flowchart = parsed.flowchart.replace(/\|>\s*/g, "| ");
      }

      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError, content);
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
