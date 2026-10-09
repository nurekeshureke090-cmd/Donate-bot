// api/proxy.js — YAGONA fayl: PlayPay proxy + umumiy sozlamalar (/_config)
// ============================================================
//  SIRLARNI SHU YERGA YOZING (GitHub repo PRIVATE bo'lsin!)
//  Vercel Environment Variables'da bor qiymat shu yerdagidan ustun turadi.
// ============================================================
const FALLBACK = {
  BOT_TOKEN: '8914170959:AAEXGpAD0fIFWMV6S-Wr_mFw3A5utpUUqAc',          // @BotFather bergan token
  MONGO_URL: 'mongodb+srv://nurekeshureke090_db_user:qKFmlTnxjnAe27Gi@cluster0.1dcdbiw',          // mongodb+srv://...
  ADMIN_ID: '8467707826', // sizning Telegram ID
  PLAYPAY_API_KEY: 'pp_30423aa1e19e3c83031a92f3938f7760822e1f4ce025bc1a'     // PlayPay'dan olingan YANGI kalit
};

import crypto from 'crypto';

const env = (k) => process.env[k] || FALLBACK[k] || '';
const PLAYPAY_API = 'https://playpay.uz/api/v1';

const GET_PUBLIC = [/^\/games$/, /^\/games\/\d+\/packages$/, /^\/_config$/];
const GET_USER = [/^\/order\/[\w-]+$/];
const POST_USER = ['/check_id', '/order'];

const CFG_KEYS = ['videos', 'faqs', 'cardSettings', 'priceMarkups', 'vipSettings',
  'referralSettings', 'dailyBonusSettings', 'notifications', 'contests'];

function verifyInitData(initData) {
  const botToken = env('BOT_TOKEN');
  if (!initData || !botToken) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const check = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 86400) return null;
  try { return JSON.parse(p.get('user')); } catch { return null; }
}

async function getCol() {
  if (!global._cfgMongo) {
    const { MongoClient } = await import('mongodb');   // faqat kerak bo'lganda yuklanadi
    global._cfgMongo = new MongoClient(env('MONGO_URL')).connect();
  }
  const c = await global._cfgMongo;
  return c.db('payersub').collection('config');
}

function cleanVideos(v) {
  if (!Array.isArray(v) || v.length > 50) return null;
  return v.map(x => ({
    id: Number(x.id) || Date.now(),
    title: String(x.title || '').slice(0, 120),
    duration: String(x.duration || '').slice(0, 40),
    url: /^https?:\/\//i.test(String(x.url || '')) ? String(x.url).slice(0, 500) : ''
  }));
}

async function handleConfig(req, res, user) {
  try {
    const col = await getCol();
    if (req.method === 'GET') {
      const doc = (await col.findOne({ _id: 'app' })) || {};
      delete doc._id;
      return res.status(200).json(doc);
    }
    if (!user || String(user.id) !== String(env('ADMIN_ID'))) {
      return res.status(403).json({ error: "Ruxsat yo'q (ADMIN_ID yoki BOT_TOKEN noto'g'ri)" });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const set = {};
    for (const k of CFG_KEYS) {
      if (body[k] === undefined) continue;
      if (k === 'videos') {
        const v = cleanVideos(body.videos);
        if (!v) return res.status(400).json({ error: "videos noto'g'ri" });
        set.videos = v;
      } else if (JSON.stringify(body[k]).length < 200000) {
        set[k] = body[k];
      }
    }
    await col.updateOne({ _id: 'app' }, { $set: set }, { upsert: true });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Baza xatosi: MONGO_URL yoki mongodb paketi' });
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const method = req.method;
    if (method !== 'GET' && method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const path = String(req.query.path || req.body?.path || '');
    if (!path.startsWith('/') || path.includes('..') || path.includes('?')) {
      return res.status(400).json({ ok: false, error: "Noto'g'ri path" });
    }

    const user = verifyInitData(req.headers['x-telegram-init-data']);
    const isAdmin = user && String(user.id) === String(env('ADMIN_ID'));

    if (path === '/_config') return handleConfig(req, res, user);

    const apiKey = env('PLAYPAY_API_KEY');
    if (!apiKey) return res.status(500).json({ ok: false, error: 'PLAYPAY_API_KEY kiritilmagan (api/proxy.js)' });

    if (method === 'GET') {
      const okPublic = GET_PUBLIC.some(r => r.test(path));
      const okUser = GET_USER.some(r => r.test(path)) && user;
      const okAdmin = path === '/balance' && isAdmin;
      if (!okPublic && !okUser && !okAdmin) return res.status(403).json({ ok: false, error: "Ruxsat yo'q" });
    } else if (!POST_USER.includes(path) || !user) {
      return res.status(403).json({ ok: false, error: "Ruxsat yo'q" });
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
