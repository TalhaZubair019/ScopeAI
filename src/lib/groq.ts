const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchGroq(payload: any, options: { timeout?: number; maxRetries?: number } = {}) {
  const { timeout = 60000, maxRetries = 3 } = options;

  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error("Missing GROQ API keys in environment");
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Rotate keys on each retry if multiple exist
    const activeKey = keys[(attempt - 1) % keys.length];

    try {
      console.log(`Groq API Attempt ${attempt}/${maxRetries}...`);

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Handle Rate Limits (429)
      if (response.status === 429) {
        console.warn(`GROQ API Rate Limit (429) on attempt ${attempt}.`);
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await sleep(delay);
          continue;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Groq API Error Response:", errorData);
        throw new Error(errorData?.error?.message || `Groq API returned ${response.status}`);
      }

      return await response.json();

    } catch (error: any) {
      lastError = error;

      if (error.name === "AbortError") {
        console.error(`Groq API request timed out on attempt ${attempt}.`);
        // If it's a total timeout, we usually don't retry unless we think the next attempt will be faster.
        // But for unstable internet, a fresh connection might help.
      } else {
        console.error(`Groq API Fetch Failure on attempt ${attempt}:`, error.message);
      }

      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } else {
        break;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // If we reach here, all attempts failed
  console.error("All Groq API attempts failed.", lastError);

  if (lastError?.name === "AbortError") {
    throw new Error(`Groq API request timed out after multiple attempts (${timeout / 1000}s each)`);
  }

  throw lastError;
}
