import { NextRequest, NextResponse } from "next/server";
import { fetchGroq } from "@/lib/groq";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { originalCode, issueDescription } = await req.json();

    if (!originalCode || !issueDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedIssues = Array.isArray(issueDescription)
      ? issueDescription.map(i => `- ${i}`).join("\n")
      : issueDescription;

    const systemPrompt = `
      You are an expert Senior Software Engineer and Security Researcher.
      Your task is to fix ${Array.isArray(issueDescription) ? "ALL of the following issues" : "a specific issue"} in the provided code.
      
      ISSUE(S) TO FIX:
      ${formattedIssues}
      
      CRITICAL ANALYSIS INVARIANTS (YOU MUST ADHERE TO THESE):
      - **THE ATOMICITY INVARIANT**: All mathematical mutations on shared resources (balances, inventory) MUST be performed atomically in the database query (SET x = x + y).
      - **THE FINANCIAL MATH INVARIANT**: Enforce integers (cents) or strict decimal libraries for currency. NEVER use JavaScript floating-point for financial calculations.
      - **THE TRANSACTIONAL INTEGRITY INVARIANT**: Multi-step operations or external API calls MUST be wrapped in strict database transactions (BEGIN/COMMIT).
      - **THE SENSITIVE LEAKAGE INVARIANT**: Never return stack traces or internal context to the client.
      
      RULES:
      1. Provide ONLY the fully corrected code block addressing ${Array.isArray(issueDescription) ? "every listed point" : "the issue"}.
      2. **ZERO REGRESSION**: Your fix MUST NOT introduce new architectural flaws, security vulnerabilities, or performance bottlenecks.
      3. **SCORE OPTIMIZATION**: Provide the code which gets the highest possible Security, Performance, Maintainability, and Reliability ratings.
      4. **CONTEXT PRESERVATION**: Maintain the original language, existing imports, and all surrounding logic that is not related to the fix.
      5. Do NOT provide explanations, pleasantries, or markdown formatting outside of the code block.
    `;

    const data = await fetchGroq({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: originalCode },
      ],
      temperature: 0.2, // Lower temperature for more deterministic code generation
    });

    const fixedCode = data.choices[0].message.content;
    return NextResponse.json({ fixedCode });
  } catch (error: any) {
    console.error("Fix engine error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate fix" },
      { status: 502 }
    );
  }
}
