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
      
      BATCH REMEDIATION RULES (HARD CONSTRAINTS):
      1. START YOUR RESPONSE IMMEDIATELY with the first file header.
      2. NEVER provide introductory sentences, pleasantries, or conclusions.
      3. **NO TAGS**: NEVER use tags like [FIX_ACTION] or [MISSING_DEPENDENCY]. These are for the Auditor only.
      4. ONLY provide corrected code blocks for files that require modification.
      5. EACH code block MUST be preceded by a bold header: **FILE: <filename>**
      6. For files that do NOT require changes, provide a one-line note (e.g., *No changes required for <filename>*).
      7. **ZERO REGRESSION**: Your fix MUST NOT introduce new architectural flaws.
      8. **CONTEXT PRESERVATION**: Maintain original language and surrounding logic.
      9. Provide ONLY the corrected code blocks and their file headers.
    `;

    // Extract custom rules from history
    const customLogic = history.findLast((m: any) => m.customRules)?.customRules;

    let finalSystemPrompt = systemPrompt;
    if (customLogic && customLogic.trim() !== "") {
      finalSystemPrompt += `\n\n**USER'S CUSTOM VALIDATION LOGIC (HIGH PRIORITY)**:\nYou MUST strictly follow these rules provided by the user while repairing the code:\n"${customLogic}"\nEnsure the remediation is 100% compliant with these custom directives.`;
    }

    const data = await fetchGroq({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: finalSystemPrompt },
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
