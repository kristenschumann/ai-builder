const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envFile = path.join(__dirname, '.env.local');
fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const handler = require('./api/roadmap');

const PORT = 3000;
const ROOT = __dirname;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API route
  if (url.pathname === '/api/roadmap') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      if (body) {
        try { req.body = JSON.parse(body); } catch { req.body = body; }
      }
      handler(req, res);
    });
    return;
  }

  // Static files
  let filePath = url.pathname === '/' ? '/ai-builder-dashboard.html' : url.pathname;
  const fullPath = path.join(ROOT, filePath);

  if (!fullPath.startsWith(ROOT)) return res.writeHead(403).end();

  fs.readFile(fullPath, (err, data) => {
    if (err) return res.writeHead(404).end('Not found');
    const ext = path.extname(fullPath);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Dev server running at http://localhost:${PORT}`));
