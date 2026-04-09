import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, ChatAttachment } from "@/lib/types";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Polyfill for Node.js environment to support pdfjs-dist
if (typeof global.DOMMatrix === "undefined") {
  (global as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor() {}
    static fromMatrix(other: any) {
      const m = new DOMMatrix();
      Object.assign(m, other);
      return m;
    }
  };
}

if (typeof global.ImageData === "undefined") {
  (global as any).ImageData = class ImageData {
    constructor(public data: Uint8ClampedArray, public width: number, public height: number) {}
  };
}

if (typeof global.Path2D === "undefined") {
  (global as any).Path2D = class Path2D {
    constructor() {}
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  };
}

import { PDFParse } from "pdf-parse";
import { fetchWebContent } from "@/lib/webReader";
import { fetchGroq } from "@/lib/groq";

export const runtime = "nodejs";

async function parseDocument(attachment: ChatAttachment): Promise<string> {
  try {
    const base64Data = attachment.url.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    if (attachment.type === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      return `[File: ${attachment.name}]\n${data.text}\n`;
    } else if (attachment.type.startsWith("text/") || attachment.name.endsWith(".md") || attachment.name.endsWith(".ts") || attachment.name.endsWith(".js")) {
      return `[File: ${attachment.name}]\n${buffer.toString("utf-8")}\n`;
    }
    return "";
  } catch (error) {
    console.error("Parse error for", attachment.name, error);
    return `[Error parsing ${attachment.name}]\n`;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const client = await clientPromise;
    const db = client.db("ScopeAI");

    if (id) {
      const chat = await db.collection("chats").findOne({ _id: new ObjectId(id) });
      return NextResponse.json(chat);
    }

    const chats = await db.collection("chats").find({}).project({ messages: 0 }).sort({ updatedAt: -1 }).toArray();
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, chatId, title } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const attachments = lastMessage.attachments || [];

    let hasImages = messages.some((m: ChatMessage) =>
      m.attachments?.some(a => a.type.startsWith("image/"))
    );
    let documentContext = "";
    let webContext = "";

    // Parse ONLY the current message's documents for context injection
    for (const file of attachments) {
      if (!file.type.startsWith("image/")) {
        documentContext += await parseDocument(file);
      }
    }

    //Web Link: Scan for URLs in lastMessage.content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = lastMessage.content.match(urlRegex);
    if (urls && urls.length > 0) {
      for (const url of urls) {
        webContext += await fetchWebContent(url);
      }
    }

    // Build Groq Payload
    const model = hasImages ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

    const formattedMessages = messages.map((m: ChatMessage, idx: number) => {
      const isLast = idx === messages.length - 1;
      let content: any = m.content;

      if (isLast && (documentContext || webContext)) {
        content = `CONTEXT INGESTED:\n${documentContext}\n${webContext}\n\nUSER MESSAGE: ${m.content}`;
      }

      if (m.attachments?.some(a => a.type.startsWith("image/"))) {
        const parts: any[] = [{ type: "text", text: content }];
        m.attachments.filter(a => a.type.startsWith("image/")).forEach(img => {
          parts.push({
            type: "image_url",
            image_url: { url: img.url }
          });
        });
        return { role: m.role, content: parts };
      }

      return { role: m.role, content };
    });

    const systemPrompt = `You are ScopeAI Intelligence, a high-fidelity architectural mapping and technical assistant. 
    You have VISION capabilities to analyze diagrams and screenshots.
    You also analyze UPLOADED DOCUMENTS provided as context.
    
    CRITICAL INSTRUCTION:
    - Maintain absolute technical precision. 
    - When generating code, ensure function names match their calls.
    - Match comments exactly to the logic they describe.
    - Use clear, professional documentation in your responses.
    - Always prioritize structural integrity in your logic.`;

    const data = await fetchGroq({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...formattedMessages],
      temperature: 0.5,
      max_tokens: 2048,
    });
    const assistantMessage = data.choices[0].message;

    // Persist to DB
    const client = await clientPromise;
    const db = client.db("ScopeAI");
    const allMessages = [...messages, assistantMessage];
    let currentId = chatId;

    if (!chatId) {
      let newTitle = title;
      if (!newTitle) {
        try {
          //Title Generation: Summarize the initial inquiry
          const titleData = await fetchGroq({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "Create a 3-5 word technical title for this prompt. Return ONLY the title. No quotes." },
              { role: "user", content: messages[0].content }
            ],
            max_tokens: 20,
            temperature: 0.3,
          });
          newTitle = titleData.choices[0].message.content.trim() || "Intellectual Session";
        } catch (e) {
          newTitle = messages[0].content.slice(0, 30) + "...";
        }
      }

      const result = await db.collection("chats").insertOne({
        title: newTitle,
        messages: allMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      currentId = result.insertedId.toString();
    } else {
      await db.collection("chats").updateOne(
        { _id: new ObjectId(chatId) },
        { $set: { messages: allMessages, updatedAt: new Date().toISOString() } }
      );
    }

    return NextResponse.json({ message: assistantMessage, chatId: currentId });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("ScopeAI");
    await db.collection("chats").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const { id, title } = await req.json();
    if (!id || !title) return NextResponse.json({ error: "ID and Title required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("ScopeAI");
    await db.collection("chats").updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, updatedAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH Error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
