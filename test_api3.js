import handler from './api/proxy.js';
import http from 'http';

const server = http.createServer((req, res) => {
  req.query = new URL('http://localhost' + req.url).searchParams;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.end(JSON.stringify(data)); return res; };
  req.body = {};
  handler(req, res);
});
server.listen(3002, () => console.log('Listening on 3002'));
