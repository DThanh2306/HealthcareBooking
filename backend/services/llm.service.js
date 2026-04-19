const axios = require('axios');

const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '';

async function callLLM({ messages = [], prompt = null, model = 'gpt-3.5-turbo', max_tokens = 500, temperature = 0.2 } = {}) {
  try {
    const payload = prompt
      ? { model, messages: [{ role: 'user', content: prompt }], max_tokens, temperature }
      : { model, messages, max_tokens, temperature };

    const headers = { 'Content-Type': 'application/json' };
    if (LLM_API_KEY) headers.Authorization = `Bearer ${LLM_API_KEY}`;

    const resp = await axios.post(LLM_API_URL, payload, { headers, timeout: 60000 });

    // Support OpenAI style responses
    let text = '';
    if (resp?.data?.choices && resp.data.choices.length > 0) {
      const c = resp.data.choices[0];
      if (c.message && c.message.content) text = c.message.content;
      else if (c.text) text = c.text;
    } else if (typeof resp.data === 'string') {
      text = resp.data;
    }

    return { ok: true, text, raw: resp.data };
  } catch (err) {
    console.error('llm.service callLLM error:', err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

module.exports = { callLLM };
