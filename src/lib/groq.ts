const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function fetchGroq(payload: any) {
  const apiKey1 = process.env.GROQ_API_KEY;
  const apiKey2 = process.env.GROQ_API_KEY_2;

  if (!apiKey1 && !apiKey2) {
    throw new Error("Missing GROQ API keys in environment");
  }

  let activeKey = apiKey1 || apiKey2;
  
  let response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${activeKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // Failover to secondary key on 429 (Rate Limit)
  if (!response.ok && response.status === 429 && apiKey1 && apiKey2 && activeKey === apiKey1) {
    console.warn("GROQ API Rate Limit Hit! Switching to backup API key...");
    activeKey = apiKey2;
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${activeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Groq API Error:", errorData);
    throw new Error(errorData?.error?.message || "Failed to connect to Groq API");
  }

  return response.json();
}
