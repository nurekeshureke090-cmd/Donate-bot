// api/proxy.js - PlayPay API proxy (xavfsiz variant)
// Kalit kodda emas, Vercel Environment Variables ichida: PLAYPAY_API_KEY
import { env, verifyInitData } from './_env.js';

const PLAYPAY_API = 'https://playpay.uz/api/v1';

const GET_PUBLIC = [/^\/games$/, /^\/games\/\d+\/packages$/];   // hamma ko'ra oladi
const GET_USER = [/^\/order\/[\w-]+$/];                          // faqat Telegram foydalanuvchisi
const POST_USER = ['/check_id', '/order'];                       // faqat Telegram foydalanuvchisi

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const apiKey = env('PLAYPAY_API_KEY');
  if (!apiKey) return res.status(500).json({ ok: false, error: 'PLAYPAY_API_KEY kiritilmagan (api/_env.js)' });

  try {
    const method = req.method;
    if (method !== 'GET' && method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const path = String(req.query.path || req.body?.path || '');
    if (!path.startsWith('/') || path.includes('..') || path.includes('?')) {
      return res.status(400).json({ ok: false, error: 'Noto\'g\'ri path' });
    }

    const user = verifyInitData(req.headers['x-telegram-init-data']);
    const isAdmin = user && String(user.id) === String(env('ADMIN_ID'));

    if (method === 'GET') {
      const okPublic = GET_PUBLIC.some(r => r.test(path));
      const okUser = GET_USER.some(r => r.test(path)) && user;
      const okAdmin = path === '/balance' && isAdmin;
      if (!okPublic && !okUser && !okAdmin) return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
    } else {
      if (!POST_USER.includes(path) || !user) return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
    }

    let url = `${PLAYPAY_API}${path}`;
    if (method === 'GET') url += '?currency=UZS';

    const options = { method, headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } };
    if (method === 'POST' && req.body?.data) options.body = JSON.stringify(req.body.data);

    const response = await fetch(url, options);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
}
