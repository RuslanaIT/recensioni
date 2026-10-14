// API per le settimane salvate del contest (Vercel Serverless Function, Node 18+).
// Dati su Upstash Redis (Vercel Marketplace). Lettura libera, scrittura solo con ADMIN_KEY.
const KEY = 'contest:settimane';
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.ADMIN_KEY;

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `Redis ${r.status}`);
  return j.result;
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = []; for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const validId = id => typeof id === 'string' && /^\d{4}-W\d{2}$/.test(id);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !TOKEN) return res.status(503).json({ error: 'Database non configurato: collega Upstash Redis al progetto Vercel.' });
  try {
    if (req.method === 'GET') {
      const flat = (await redis(['HGETALL', KEY])) || [];
      const list = [];
      for (let i = 0; i < flat.length; i += 2) { try { list.push({ id: flat[i], ...JSON.parse(flat[i + 1]) }); } catch (e) {} }
      return res.status(200).json(list);
    }
    if (!ADMIN || req.headers['x-admin-key'] !== ADMIN) return res.status(401).json({ error: 'Chiave per salvare mancante o errata.' });
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req); const id = body && body.id;
      if (!validId(id)) return res.status(400).json({ error: 'Settimana non valida.' });
      const json = JSON.stringify(body);
      if (json.length > 500000) return res.status(413).json({ error: 'Settimana troppo grande.' });
      await redis(['HSET', KEY, id, json]); return res.status(200).json({ ok: true, id });
    }
    if (req.method === 'DELETE') {
      const id = (req.query && req.query.id) || new URL(req.url, 'http://x').searchParams.get('id');
      if (!validId(id)) return res.status(400).json({ error: 'Settimana non valida.' });
      await redis(['HDEL', KEY, id]); return res.status(200).json({ ok: true, id });
    }
    res.setHeader('Allow', 'GET, PUT, DELETE'); return res.status(405).json({ error: 'Metodo non consentito.' });
  } catch (e) { return res.status(500).json({ error: 'Errore del database: ' + e.message }); }
};
