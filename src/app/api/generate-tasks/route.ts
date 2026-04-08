import { NextRequest, NextResponse } from "next/server";

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
      Generate a HIGHLY DETAILED technical Mermaid.js flowchart (graph LR).
      - **GRANULAR DETAIL**: Show logic gates, data transitions, and granular steps.
      - **SIMPLE WORDING**: Use plain English (e.g., "Check Login" NOT "Auth Logic").
      - Use 'graph LR' ONLY.
      - **STRICT LABELS**: EVERY node label MUST be in double quotes inside brackets/braces.
        - Node: ID["Label Text"]
        - Decision: ID{"Question?"}
      - ORGANIZE into systematic subgraphs with double-quoted titles.
      
      SYNTAX RULES (STRICT):
      - NO special characters outside of labels.
      - NO parentheses '()' or single brackets '[]' unless the label inside is double-quoted.
      - For labeled arrows: A -->|Label Text| B.
      - Subgraph: subgraph "Title"\n ... \nend

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
  
        // Auto-fix common Mermaid syntax hallucinations
        if (parsed.flowchart) {
          let chart = parsed.flowchart
            .replace(/```mermaid\n?/g, "") // Remove stray markdown markers
            .replace(/```/g, "")
            .replace(/\|>\s*/g, "| ") // Fix labeled arrows hallucination
            .replace(/endsubgraph/g, "\nend") // Fix non-existent keyword
            .replace(/([a-zA-Z0-9\]\)])\s*(end)\b/g, "$1\n$2") // Ensure newline before end keyword
            .replace(/subgraph\s+\[(.*?)\]/g, 'subgraph "$1"') // Fix subgraph bracket hallucination
            .replace(/subgraph\s+([^\n"]+)\n/g, 'subgraph "$1"\n') // Ensure quotes for unquoted subgraph titles
            .replace(/-->\s*\|([^|]+)\|\s*>/g, "-->|$1|") // Fix malformed arrowheads
            .replace(/\|"([^"]+)"\|/g, "|$1|") // Fix invalid quotes inside pipes
            .replace(/-->\s*"([^"]+)"/g, '--> ["$1"]') // Fix quotes used as nodes without brackets
            .replace(/\{([^{}]+)\}/g, (match: string, p1: string) => {
              if (p1.startsWith('"') && p1.endsWith('"')) return match;
              return `{"${p1}"}`; // Force quotes inside diamonds
            })
            .replace(/\[([^\[\]]+)\]/g, (match: string, p1: string) => {
              if (p1.startsWith('"') && p1.endsWith('"')) return match;
              if (match.startsWith("subgraph")) return match;
              return `["${p1}"]`; // Force quotes inside boxes
            });

          // --- STRIP MULTIPLE GRAPH HEADERS ---
          // Find the first instance of 'graph LR' or 'graph TD' and remove any others
          const graphHeaderMatch = chart.match(/graph\s+(LR|TD|RL|BT)/i);
          if (graphHeaderMatch) {
            const header = graphHeaderMatch[0];
            chart = chart.replace(/graph\s+(LR|TD|RL|BT)/gi, ""); // Remove all
            chart = header + "\n" + chart; // Add back one at the top
          } else {
            chart = "graph LR\n" + chart; // Force LR if missing
          }

          parsed.flowchart = chart.trim();
        }

        // --- ROBUST SEQUENTIAL DATE CALCULATION ---
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          let trackingDate = new Date(currentStartDate);
          
          parsed.tasks = parsed.tasks.map((task: any) => {
            // Helper to skip weekends
            const skipIfWeekend = (d: Date) => {
              if (!skipWeekends) return;
              let day = d.getUTCDay();
              while (day === 6 || day === 0) { // Saturday or Sunday
                d.setUTCDate(d.getUTCDate() + 1);
                day = d.getUTCDay();
              }
            };

            // Ensure we start on a working day
            skipIfWeekend(trackingDate);

            // Assign the date
            task.due_date = trackingDate.toISOString().split("T")[0];

            // Calculate duration to increment for the NEXT task
            // We'll parse the duration string (e.g. "2 days", "1 week")
            let durationDays = 1;
            if (task.duration) {
              const match = task.duration.match(/(\d+)/);
              if (match) {
                durationDays = parseInt(match[1]);
                if (task.duration.toLowerCase().includes("week")) durationDays *= 5; // Working days
                if (task.duration.toLowerCase().includes("month")) durationDays *= 20; // Working days
              }
            }

            // Increment trackingDate based on duration
            for (let i = 0; i < durationDays; i++) {
              trackingDate.setUTCDate(trackingDate.getUTCDate() + 1);
              skipIfWeekend(trackingDate);
            }

            return task;
          });
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
