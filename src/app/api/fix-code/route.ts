import { NextRequest, NextResponse } from "next/server";
import { fetchGroq } from "@/lib/groq";

export const runtime = "nodejs";
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
      You are the Apex Polyglot Remediation Engineer.
      Your explicit task is to repair and optimize ${Array.isArray(issueDescription) ? "ALL of the following issues" : "a specific issue"} across the provided architectural files.
      
      ISSUE(S) TO FIX:
      ${formattedIssues}
      
      THE REMEDIATION MANDATE (HARD CONSTRAINTS):
      1. **DYNAMIC ADAPTATION**: Identify the language/framework of the original code. Your fix MUST utilize the idiomatic patterns, standard libraries, and optimal syntax of THAT specific ecosystem.
      2. **ZERO REGRESSION**: Your code changes MUST NOT introduce new architectural flaws, security vulnerabilities, memory leaks, or performance bottlenecks.
      3. **CONTEXT PRESERVATION**: Do not rewrite the entire file unless necessary. Maintain the original business logic, variable naming conventions, and surrounding architecture.
      
      OUTPUT FORMATTING ENGINE (STRICT RULESET):
      1. START IMMEDIATELY with the first file header.
      2. **REMEDIATION SUMMARIES**: For each modified file, provide a concise bulleted list (max 3 points) titled '**APPLIED FIXES:**' immediately after the file header and before the code block.
      3. **NO TAGS**: NEVER output tags like [FIX_ACTION], [MISSING_DEPENDENCY], or [SCORES]. 
      4. ONLY provide corrected code blocks for files that require modification.
      5. EACH code block MUST be preceded by a bold header indicating the target file.
         - If fixing a specific named file, use: **FILE: <filename>**
         - If the input was a raw snippet without a filename, use: **FILE: resolution_context**
      6. For files provided in the context that do NOT require modification, provide a single line: *No changes required for <filename>*
      7. Output ONLY the file headers, the remediation summaries, and the markdown code blocks. NO introductory sentences or conclusions.
    `;

    // Extract custom rules from history
    const customLogic = history.findLast((m: any) => m.customRules)?.customRules;

    let finalSystemPrompt = systemPrompt;
    if (customLogic && customLogic.trim() !== "") {
      finalSystemPrompt += `\n\n=========================================\n**ABSOLUTE DIRECTIVE OVERRIDE**\nThe user previously defined this custom rule: "${customLogic}"\n\nCRITICAL INSTRUCTION: Your generated code fix MUST be 100% compliant with this custom directive. Prioritize this rule above standard idioms if they conflict.\n\nFORMATTING LOCK (CRITICAL): Even under this custom directive, you MUST STRICTLY adhere to the 'OUTPUT FORMATTING ENGINE' rules. NEVER provide explanations, text, or summaries. Output ONLY the **FILE: <filename>** headers and the corrected code blocks.`;
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
