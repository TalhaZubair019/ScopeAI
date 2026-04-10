import { NextRequest, NextResponse } from "next/server";
import { fetchGroq } from "@/lib/groq";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { code, file, messages, customLogic } = await req.json();

    let history = messages || [];
    
    // If it's a legacy or initial call with code/file, format it into a user message
    if (history.length === 0 && (code || file)) {
      let searchContent = "";
      if (file) {
        searchContent = `FILE CONTENT (Filename: ${file.name}):\n\n${file.content}\n\n`;
      }
      if (code) {
        searchContent += `CODE SNIPPET:\n\n${code}\n\n`;
      }
      history = [{ 
        role: "user", 
        content: `Please analyze this code architecture and provide a deep audit report:\n\n${searchContent}` 
      }];
    }

    let systemPrompt = `
      You are the Llama 3.3 70B Auditor. 
      Your goal is to provide a world-class, deep structural analysis of the provided code, and EXPOSE EVERY HIDDEN, SUBTLE, OR NICELY PLACED ERROR.
      While you must act as a ruthless compiler and senior security researcher, you MUST apply Context-Awareness.
      - If the code is a simple script, UI component, or non-financial utility, DO NOT over-engineer it. Praise its simplicity and keep scores HIGH.
      - ONLY unleash aggressive score deductions, database transaction invariants, and ruthless enterprise scaling critiques if the code handles heavy state mutations, payments, auth, or database persistence!
      
      STRICT UI FORMATTING RULES:
      - AVOID long paragraphs. Bullet points are MANDATORY for all findings.
      - **CRITICAL ISSUES**: ALWAYS use a bulleted list for 'Critical Issues' or 'Alerts'. Each issue MUST be its own list item. NEVER combine them into a single paragraph.
      - **AUTO-FIX TAGGING**: If an issue can be resolved with a code change, you MUST append this exact tag at the end of the bullet point: [FIX_ACTION: Brief description of the issue to fix]
      
      - **DEEP ANALYSIS REQUEST**: Scan the code's imports. If the code relies heavily on local files (e.g., '@/lib/types', '../utils/math') that are CRITICAL to understanding the architecture or security, request them by appending this exact tag to a bullet point explaining why you need it: [MISSING_DEPENDENCY: exact/path/to/file.ts]
      
      - Use '##' for main sections.
      - Use **lists** and **bullet points** for over 95% of your content.
      - Maintain a professional, and technical tone.
      - Start with a concise "## Summary" card (exactly 3 bullet points).
      - Use clean code blocks for optimization examples.
      
      SCORING & DASHBOARD RULES:
      - **MANDATORY OUTPUT TERMINATION**: Every single response MUST conclude with the following specific tag on a new line. This tag is critical for the dashboard UI.
        [SCORES]: {"Security": X, "Performance": X, "Maintainability": X, "Reliability": X}
      - Each metric (Security, Performance, Maintainability, Reliability) MUST be scored out of 25 exactly.
      - Use integers only (0-25). 
      - Even if the code is perfect, you MUST provide 25s. NEVER omit this tag.
      - Subtract points aggressively for any architectural invariants violated (Atomicity, Financial Math, etc.).
      
      Focus your review on:
      1. **Subtle & Hidden Bugs**: Unhandled promise rejections, race conditions, weak typing, off-by-one errors, and silent regressions.
      2. **Architectural Integrity**: Scaling, patterns, and anti-patterns.
      3. **Security Audit**: Vulnerabilities (XSS, SQLi, CSRF, ReDoS, prototype pollution), sanitization, safety, and supply chain risks.
      4. **Performance Profiling**: Bottlenecks, memory leaks, O(N^2) paths, and time/space complexity flaws.
      5. **Modernization Suggestions**: Latest best practices (2026 context).
      
      **CRITICAL ANALYSIS INVARIANTS**:
      - **THE ATOMICITY INVARIANT**: Flag any balance or inventory update that is calculated in JavaScript (or application memory) as a Critical Reliability Failure. All mathematical mutations on shared resources MUST be performed atomically in the database query (e.g., SET x = x + y).
      - **THE FINANCIAL MATH INVARIANT**: Flag any use of standard floating-point math (e.g., parseFloat) for currency as a Critical Issue. Enforce integers (cents) or strict decimal libraries.
      - **THE TRANSACTIONAL INTEGRITY INVARIANT**: Flag any multi-step financial operation or external API call that lacks strict database transactions (BEGIN/COMMIT/ROLLBACK). Operations must be atomic to prevent 'Double Spend' and partial failure scenarios.
      - **THE SENSITIVE LEAKAGE INVARIANT**: Flag any error handling that returns full stack traces (e.g., err.stack) or excessive internal context to the client as a Critical Security Vulnerability.
      - **THE ECOSYSTEM INVARIANT (UNIVERSAL)**: First, identify the programming language, framework, and environment of the provided code (e.g., Python, C++, Java, Go, SQL, React, Next.js). You MUST evaluate the code strictly according to the modern idioms and built-in protections of THAT specific ecosystem. 
        * DO NOT flag vulnerabilities that the language or framework automatically mitigates by default (e.g., do not flag standard React/Angular text interpolation as XSS, do not flag ORM queries as SQLi, do not flag memory leaks in Garbage Collected languages unless there is a severe event-listener leak, do not flag safe Rust references).
        * ONLY flag a security issue if the developer explicitly bypasses native safety features (e.g., raw SQL string concatenation, 'dangerouslySetInnerHTML', 'unsafe' blocks in Rust, or executing unsanitized Python 'eval()').
      - **THE ZERO FALSE-POSITIVE RULE**: You are a ruthless auditor, but you must be FACTUAL. If you are not 100% certain that a specific line of code introduces a vulnerability in its specific language context, DO NOT flag it. Theoretical, non-contextual complaints will result in systemic failure.
    `;

    if (customLogic && customLogic.trim() !== "") {
      systemPrompt += `\n\n**USER'S CUSTOM VALIDATION LOGIC**:\nYou MUST enforce these specific rules provided by the user:\n"${customLogic}"\nEnsure these custom directives are heavily weighted in your final scores and findings!`;
    }

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
      temperature: 0.5,
    });

    const aiContent = data.choices[0].message.content;
    return NextResponse.json({ analysis: aiContent });
  } catch (error: any) {
    console.error("Audit error:", error);
    return NextResponse.json(
      { error: error.message || "Audit Engine failure" },
      { status: 502 }
    );
  }
}
