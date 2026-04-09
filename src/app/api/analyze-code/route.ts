import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { code, file } = await req.json();

    if (!code && !file) {
      return NextResponse.json(
        { error: "No code or file provided for analysis" },
        { status: 400 }
      );
    }

    const apiKey1 = process.env.GROQ_API_KEY;
    const apiKey2 = process.env.GROQ_API_KEY_2;
    if (!apiKey1 && !apiKey2) {
      return NextResponse.json(
        { error: "Missing GROQ API keys in environment" },
        { status: 500 }
      );
    }

    let searchContent = "";
    if (file) {
      searchContent = `FILE CONTENT (Filename: ${file.name}):\n\n${file.content}\n\n`;
    }
    if (code) {
      searchContent += `CODE SNIPPET:\n\n${code}\n\n`;
    }

    const systemPrompt = `
      You are the Llama 3.3 70B Auditor. 
      Your goal is to provide a world-class, deep structural analysis of the provided code, and EXPOSE EVERY HIDDEN, SUBTLE, OR NICELY PLACED ERROR.
      While you must act as a ruthless compiler and senior security researcher, you MUST apply Context-Awareness.
      - If the code is a simple script, UI component, or non-financial utility, DO NOT over-engineer it. Praise its simplicity and keep scores HIGH (respecting the KISS principle).
      - ONLY unleash aggressive score deductions, database transaction invariants, and ruthless enterprise scaling critiques if the code handles heavy state mutations, payments, auth, or database persistence!
      
      STRICT UI FORMATTING RULES:
      - AVOID long paragraphs. Bullet points are MANDATORY for all findings.
      - **CRITICAL ISSUES**: ALWAYS use a bulleted list for 'Critical Issues' or 'Alerts'. Each issue MUST be its own list item. NEVER combine them into a single paragraph.
      - Use '##' for main sections.
      - Use **lists** and **bullet points** for over 95% of your content.
      - Maintain a professional, and technical tone.
      - Start with a concise "## Summary" card (exactly 3 bullet points).
      - Use clean code blocks for optimization examples.
      
      SCORING RULES:
      - ALWAYS conclude the analysis with a section titled "## PROPOSED ARCHITECTURAL REFINEMENT" containing the full, corrected, and optimized version of the provided code.
      - At the VERY END of your report, AFTER the refined code, you MUST provide a diagnostic score in a single line using this exact format:
        [SCORES]: {"Security": , "Performance": , "Maintainability": , "Reliability": }
      - Each metric MUST be scored out of 25 exactly. The grand total should represent overall code integrity (0-100). Subtract points aggressively for any hidden flaws.
      - Use integers only (0-25). 
      
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
    `;

    const fetchPayload = {
      model: "llama-3.3-70b-versatile", // Valid Groq model for deep analysis
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this code architecture and provide a deep audit report:\n\n${searchContent}` },
      ],
      temperature: 0.5, // Lower temperature for more analytical output
    };

    let activeKey = apiKey1 || apiKey2;
    let response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${activeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fetchPayload),
    });

    if (!response.ok) {
      if (response.status === 429 && apiKey1 && apiKey2) {
        console.warn("GROQ API Rate Limit Hit! Switching to backup API key...");
        activeKey = apiKey2;
        response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fetchPayload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Groq API error:", errorData);
        return NextResponse.json(
          { error: "Failed to connect to Audit Engine" },
          { status: 502 }
        );
      }
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return NextResponse.json({ analysis: content });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
