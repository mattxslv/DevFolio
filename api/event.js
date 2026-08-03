const postgres = require('postgres');

let sql;
function db() {
  if (!sql) sql = postgres(process.env.DATABASE_URL, { max: 1 });
  return sql;
}

const TYPES = new Set(['resume_download', 'project_click', 'chat_open', 'chat_lead', 'engagement', 'contact_click']);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = req.body || {};
    const type = String(body.type || '');
    if (!TYPES.has(type)) {
      res.status(400).json({ error: 'bad type' });
      return;
    }
    await db()`INSERT INTO portfolio_events (visitor_id, type, detail, path, seconds, scroll_pct) VALUES (
      ${String(body.visitorId || '').slice(0, 40) || null},
      ${type},
      ${String(body.detail || '').slice(0, 300) || null},
      ${String(body.path || '/').slice(0, 200)},
      ${Number.isFinite(+body.seconds) ? Math.min(Math.round(+body.seconds), 86400) : null},
      ${Number.isFinite(+body.scrollPct) ? Math.min(Math.round(+body.scrollPct), 100) : null}
    )`;
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'log failed' });
  }
};
