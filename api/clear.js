const postgres = require('postgres');

let sql;
function db() {
  if (!sql) sql = postgres(process.env.DATABASE_URL, { max: 1 });
  return sql;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = req.body || {};
    if (body.id) {
      await db()`DELETE FROM portfolio_visits WHERE id = ${String(body.id)}`;
    } else if (body.eventId) {
      await db()`DELETE FROM portfolio_events WHERE id = ${String(body.eventId)}`;
    } else if (body.all === true) {
      await db()`DELETE FROM portfolio_events`;
      await db()`DELETE FROM portfolio_visits`;
    } else {
      res.status(400).json({ error: 'nothing to delete' });
      return;
    }
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'delete failed' });
  }
};
