/* Minimal local dev server: serves static files and mounts api/*.js handlers
   like Vercel serverless functions. Run: node dev-server.js */
require("fs").readFileSync(".env", "utf8").split("\n").forEach((l) => {
  const i = l.indexOf("=");
  if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i)] = process.env[l.slice(0, i)] || l.slice(i + 1);
});
const http = require("http");
const fs = require("fs");
const path = require("path");

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".pdf": "application/pdf", ".json": "application/json", ".webp": "image/webp", ".ico": "image/x-icon" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const clean = url.pathname.replace(/\/+$/, "") || "/";

  if (clean.startsWith("/api/")) {
    const handlerPath = path.join(__dirname, clean + ".js");
    if (!fs.existsSync(handlerPath)) { res.writeHead(404); res.end("no such function"); return; }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      req.query = Object.fromEntries(url.searchParams);
      try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
      const shim = {
        _status: 200,
        status(c) { this._status = c; return this; },
        json(o) { res.writeHead(this._status, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); },
        end(d) { res.writeHead(this._status); res.end(d); },
      };
      try { await require(handlerPath)(req, shim); } catch (e) { res.writeHead(500); res.end(String(e.message)); }
    });
    return;
  }

  let file = clean === "/" ? "/index.html" : clean;
  if (!path.extname(file)) file += ".html";
  const abs = path.join(__dirname, file);
  if (!abs.startsWith(__dirname) || !fs.existsSync(abs)) { res.writeHead(404); res.end("not found"); return; }
  res.writeHead(200, { "Content-Type": MIME[path.extname(abs)] || "application/octet-stream" });
  fs.createReadStream(abs).pipe(res);
}).listen(process.env.PORT || 3002, () => console.log(`DevFolio running at http://localhost:${process.env.PORT || 3002}`));
