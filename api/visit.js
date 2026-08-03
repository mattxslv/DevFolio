const postgres = require('postgres');

let sql;
function db() {
  if (!sql) sql = postgres(process.env.DATABASE_URL, { max: 1 });
  return sql;
}

function deviceFrom(ua) {
  if (!ua) return 'unknown';
  if (/bot|crawler|spider|preview|lighthouse|headless/i.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function browserFrom(ua) {
  if (!ua) return null;
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/firefox\//i.test(ua)) return 'Firefox';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua)) return 'Safari';
  return 'Other';
}

function osFrom(ua) {
  if (!ua) return null;
  if (/windows/i.test(ua)) return 'Windows';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = req.body || {};
    const ua = req.headers['user-agent'] || '';
    const lang = (req.headers['accept-language'] || '').split(',')[0] || null;
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
    let isp = null;
    if (ip) {
      try {
        const geo = await fetch(`https://ipwho.is/${ip}?fields=connection`, { signal: AbortSignal.timeout(2500) }).then(r => r.json());
        isp = geo?.connection?.isp || geo?.connection?.org || null;
      } catch {}
    }
    await db()`INSERT INTO portfolio_visits
      (path, referrer, user_agent, country, city, region, device, browser, os, language, timezone, screen, visitor_id, ip, isp)
      VALUES (
      ${String(body.path || '/').slice(0, 200)},
      ${String(body.referrer || '').slice(0, 300) || null},
      ${ua.slice(0, 300) || null},
      ${req.headers['x-vercel-ip-country'] || null},
      ${req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null},
      ${req.headers['x-vercel-ip-country-region'] ? decodeURIComponent(req.headers['x-vercel-ip-country-region']) : null},
      ${deviceFrom(ua)},
      ${browserFrom(ua)},
      ${osFrom(ua)},
      ${lang ? lang.slice(0, 20) : null},
      ${String(body.timezone || '').slice(0, 60) || req.headers['x-vercel-ip-timezone'] || null},
      ${String(body.screen || '').slice(0, 20) || null},
      ${String(body.visitorId || '').slice(0, 40) || null},
      ${ip},
      ${isp ? String(isp).slice(0, 120) : null}
    )`;
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'log failed' });
  }
};
