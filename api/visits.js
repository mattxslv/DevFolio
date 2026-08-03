const postgres = require('postgres');

let sql;
function db() {
  if (!sql) sql = postgres(process.env.DATABASE_URL, { max: 1 });
  return sql;
}

module.exports = async function handler(req, res) {
  try {
    const visits = await db()`
      SELECT v.id, v.ts, v.path, v.referrer, v.country, v.city, v.region, v.device, v.browser, v.os,
             v.language, v.timezone, v.screen, v.visitor_id, v.isp,
             count(*) OVER (PARTITION BY v.visitor_id) AS visitor_visits
      FROM portfolio_visits v
      ORDER BY v.ts DESC
      LIMIT 500`;
    const events = await db()`
      SELECT id, ts, visitor_id, type, detail, path, seconds, scroll_pct
      FROM portfolio_events
      ORDER BY ts DESC
      LIMIT 300`;
    const eventTotals = await db()`
      SELECT type AS k, count(*)::int AS n FROM portfolio_events
      WHERE type <> 'engagement'
      GROUP BY 1 ORDER BY n DESC`;
    const [engagement] = await db()`
      SELECT coalesce(round(avg(seconds)))::int AS avg_seconds,
             coalesce(round(avg(scroll_pct)))::int AS avg_scroll
      FROM portfolio_events WHERE type = 'engagement'`;
    const [totals] = await db()`
      SELECT count(*)::int AS total,
             count(DISTINCT visitor_id) FILTER (WHERE visitor_id IS NOT NULL)::int AS unique_visitors,
             count(*) FILTER (WHERE ts > now() - interval '24 hours')::int AS last24h,
             count(*) FILTER (WHERE ts > now() - interval '7 days')::int AS last7d,
             count(*) FILTER (WHERE ts > now() - interval '30 days')::int AS last30d
      FROM portfolio_visits`;
    const topCountries = await db()`
      SELECT coalesce(country, '??') AS k, count(*)::int AS n FROM portfolio_visits
      GROUP BY 1 ORDER BY n DESC LIMIT 6`;
    const topReferrers = await db()`
      SELECT CASE WHEN referrer IS NULL OR referrer = '' THEN 'direct'
                  ELSE regexp_replace(regexp_replace(referrer, '^https?://', ''), '/.*$', '') END AS k,
             count(*)::int AS n
      FROM portfolio_visits GROUP BY 1 ORDER BY n DESC LIMIT 6`;
    const devices = await db()`
      SELECT coalesce(device, 'unknown') AS k, count(*)::int AS n FROM portfolio_visits
      GROUP BY 1 ORDER BY n DESC`;
    const browsers = await db()`
      SELECT coalesce(browser, 'Other') AS k, count(*)::int AS n FROM portfolio_visits
      GROUP BY 1 ORDER BY n DESC LIMIT 6`;
    res.status(200).json({ totals, topCountries, topReferrers, devices, browsers, visits, events, eventTotals, engagement });
  } catch (e) {
    res.status(500).json({ error: 'query failed' });
  }
};
