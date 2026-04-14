import { NextRequest, NextResponse } from "next/server";
import { fetchGroq } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { prompt, startDate, skipWeekends } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
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
      Generate an ULTRA-DETAILED technical Mermaid.js flowchart (graph LR).
      - **GRANULAR ARCHITECTURE**: Show every single logical step, specialized database tables, cache layers, and message queues.
      - **ULTRA-HIGH COMPLEXITY & DENSITY**: You MUST generate a highly complex, granular architecture. Generate between 30 to 50 nodes. Break down the system into micro-interactions, including every API call, database transaction, cache layer, authentication check, and error handling path.
      - **DECISION LOGIC**: Include extensive conditional logic using decision diamonds (e.g., ID{"Is User Admin?"} -->|"Yes"| ...).
      - **CONNECTIVITY (CRITICAL)**: Every single node MUST be connected to another node using an arrow. Do NOT generate isolated or floating nodes.
      - **EDGE DETAILS**: You MUST add small descriptive labels on the connection lines between nodes to explain the action or condition taking place. (e.g., A["Submit Form"] -->|"Validates Data"| B["Database"]).
      - Use 'graph LR' ONLY.
      - **STRICT LABELS**: EVERY node label MUST be in double quotes inside brackets/braces.
        - Node: ID["Label Text"]
        - Decision: ID{"Question?"}
      - ORGANIZE into systematic subgraphs with double-quoted titles.
      
      SYNTAX RULES (STRICT):
      - NO special characters outside of labels.
      - NO parentheses '()' or single brackets '[]' unless the label inside is double-quoted.
      - ALWAYS connect nodes using labeled arrows: A -->|"action description"| B.
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

    const data = await fetchGroq({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    if (!data || !data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate tasks from AI provider" },
        { status: 502 }
      );
    }

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
          .replace(/\]\s*\{/g, "{") // Fix stacked shapes: ID["Label"]{"Label"} -> ID{"Label"}
          .replace(/\}\s*\[/g, "[") // Fix stacked shapes: ID{"Label"}["Label"] -> ID["Label"]
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
      let totalWorkingDays = 0;
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
          let durationDays = 1;
          if (task.duration) {
            const match = task.duration.match(/(\d+)/);
            if (match) {
              durationDays = parseInt(match[1]);
              if (task.duration.toLowerCase().includes("week")) durationDays *= 5;
              if (task.duration.toLowerCase().includes("month")) durationDays *= 20;
            }
          }

          // Add to the running total of working days
          totalWorkingDays += durationDays;

          // Increment trackingDate based on duration
          for (let i = 0; i < durationDays; i++) {
            trackingDate.setUTCDate(trackingDate.getUTCDate() + 1);
            skipIfWeekend(trackingDate);
          }

          return task;
        });
      }

      return NextResponse.json({ ...parsed, totalDays: totalWorkingDays });
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
