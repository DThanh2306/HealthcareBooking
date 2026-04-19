const retriever = require('../services/retriever.service');
const llmService = require('../services/llm.service');
const sessionService = require('../services/session.service');

exports.retrieve = async (req, res) => {
  try {
    const { query, filters, limit } = req.body || req.query || {};
    const k = Math.min(Number(limit) || 5, 50);
    const data = await retriever.retrieveByQuery(query, filters || {}, k);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('flowise.retrieve error', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

exports.callLLM = async (req, res) => {
  try {
    const { messages, prompt, options } = req.body || {};
    const result = await llmService.callLLM({ messages, prompt, ...(options || {}) });
    res.json(result);
  } catch (err) {
    console.error('flowise.callLLM error', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};

exports.sessionOp = async (req, res) => {
  try {
    const { action, sessionId, message } = req.body || {};
    switch ((action || '').toLowerCase()) {
      case 'create': {
        const s = sessionService.createSession(sessionId);
        return res.json({ ok: true, session: s });
      }
      case 'get': {
        const s = sessionService.getSession(sessionId);
        return res.json({ ok: true, session: s });
      }
      case 'append': {
        if (!message) return res.status(400).json({ ok: false, error: 'message required' });
        const s = sessionService.appendMessage(sessionId, message);
        return res.json({ ok: true, session: s });
      }
      case 'clear': {
        sessionService.clearSession(sessionId);
        return res.json({ ok: true });
      }
      default:
        return res.status(400).json({ ok: false, error: 'invalid action' });
    }
  } catch (err) {
    console.error('flowise.sessionOp error', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
};
