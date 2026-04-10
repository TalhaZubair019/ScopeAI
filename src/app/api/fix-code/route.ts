import { NextRequest, NextResponse } from "next/server";
import { fetchGroq } from "@/lib/groq";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages: history, issueDescription } = await req.json();

    if (!history || !issueDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const formattedIssues = Array.isArray(issueDescription)
      ? issueDescription.map(i => `- ${i}`).join("\n")
      : issueDescription;

    const systemPrompt = `
      You are an expert Senior Software Engineer and Security Researcher.
      Your task is to fix ${Array.isArray(issueDescription) ? "ALL of the following issues" : "a specific issue"} across the provided architectural files.
      
      ISSUE(S) TO FIX:
      ${formattedIssues}
      
      CRITICAL ANALYSIS INVARIANTS (YOU MUST ADHERE TO THESE):
      - **THE ATOMICITY INVARIANT**: All mathematical mutations on shared resources MUST be performed atomically in the database query.
      - **THE FINANCIAL MATH INVARIANT**: Enforce integers (cents) or strict decimal libraries. NEVER use JavaScript floats for currency.
      - **THE ECOSYSTEM INVARIANT (UNIVERSAL)**: Evaluate the code strictly according to the modern idioms and built-in protections of THAT specific ecosystem.
      - **THE ZERO FALSE-POSITIVE RULE**: You must be FACTUAL. If you are not 100% certain, DO NOT fix it.
      
      BATCH REMEDIATION RULES:
      1. ONLY provide corrected code blocks for files that require modification to fix the listed issues.
      2. EACH code block MUST be preceded by a bold header: **FILE: <filename>**
      3. For files that do NOT require changes, you may provide a brief one-line note (e.g., *No changes required for <filename>*), but do NOT provide their code.
      4. **ZERO REGRESSION**: Your fix MUST NOT introduce new architectural flaws or security vulnerabilities.
      5. **CONTEXT PRESERVATION**: Maintain original language, imports, and surrounding logic.
      6. Provide ONLY the corrected code blocks and their file headers. No pleasantries or meta-block wrapping.
    `;

    const data = await fetchGroq({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m: any) => {
          let content = m.content || "";
          if (m.attachments && m.attachments.length > 0) {
            const attachmentInfo = m.attachments
              .map((a: any) => `\n\nFILE: ${a.name}\nCONTENT:\n${a.url}`)
              .join("\n");
            content = `[ATTACHED_FILES]:${attachmentInfo}\n\nUSER_MESSAGE: ${content}`;
          }
          return { role: m.role, content };
        })
      ],
      temperature: 0.2,
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
