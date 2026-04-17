const axios = require("axios");

// Load .env if necessary
try {
  if (!process.env.GROQ_API_KEY) require("dotenv").config();
} catch (e) {
  // ignore
}

class LLMService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.model = process.env.GROQ_MODEL_NAME || process.env.GROQ_MODEL || "";
    this.baseUrl = (process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com").replace(/\/+$/g, "");
    this.defaultTimeout = Number(process.env.GROQ_TIMEOUT_MS ?? 15000);
  }

  isConfigured() {
    return !!(this.apiKey && this.model);
  }

  async callChatCompletion(options = {}) {
    const {
      messages,
      model = this.model,
      temperature = 0.3,
      max_tokens = 700,
      top_p = 1,
      frequency_penalty,
      presence_penalty,
      stop,
      timeout = this.defaultTimeout,
      retries = 2,
    } = options;

    if (!this.apiKey || !model) {
      throw new Error("GROQ_API_KEY or model not configured");
    }

    const url = `${this.baseUrl}/openai/v1/chat/completions`;

    const body = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
    };

    if (frequency_penalty !== undefined) body.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) body.presence_penalty = presence_penalty;
    if (stop !== undefined) body.stop = stop;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await axios.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout,
        });

        const content = resp.data?.choices?.[0]?.message?.content;
        return content ? String(content).trim() : null;
      } catch (err) {
        const isRateLimit = err.response?.status === 429;
        const isLast = attempt === retries;

        if (err.response) {
          // If rate limited, exponential backoff and retry
          if (isRateLimit && !isLast) {
            const wait = Math.min(2000 * Math.pow(2, attempt), 10000);
            await new Promise((r) => setTimeout(r, wait));
            continue;
          }
          // Non-retryable HTTP error
          throw new Error(`LLM API error: ${err.response.status}`);
        } else if (err.request) {
          throw new Error("LLM API no response / timeout");
        } else {
          throw err;
        }
      }
    }

    return null;
  }

  parseJSONResponse(responseText) {
    try {
      let cleaned = String(responseText || "").trim();
      cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("❌ JSON parsing failed in llm.service:", error.message);
      console.error("Response:", responseText);
      throw new Error("Failed to parse LLM response as JSON");
    }
  }
}

module.exports = new LLMService();
