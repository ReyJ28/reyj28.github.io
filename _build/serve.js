const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const PORT = process.env.PORT || 5580;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let filePath = path.join(ROOT, urlPath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      if (!path.extname(filePath)) {
        filePath = path.join(ROOT, urlPath, 'index.html');
        return fs.readFile(filePath, (err2, data) => {
          if (err2) return notFound(res);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
      }
      return notFound(res);
    }
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err2, data) => {
      if (err2) return notFound(res);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}).listen(PORT, () => console.log('serving on', PORT));

function notFound(res) {
  const p404 = path.join(ROOT, '404.html');
  fs.readFile(p404, (err, data) => {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data || 'Not found');
  });
}
