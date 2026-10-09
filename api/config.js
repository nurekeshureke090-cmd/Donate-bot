// Vercel serverless funksiya: umumiy sozlamalar (videolar, FAQ, karta, narxlar...)
// GET  /api/config  -> hamma o'qiy oladi
// POST /api/config  -> faqat ADMIN_ID (Telegram initData HMAC orqali tekshiriladi)
import { MongoClient } from 'mongodb';
import { env, verifyInitData } from './_env.js';

const KEYS = ['videos', 'faqs', 'cardSettings', 'priceMarkups', 'vipSettings',
  'referralSettings', 'dailyBonusSettings', 'notifications', 'contests'];

let clientPromise = global._cfgMongo;
function getCol() {
  if (!clientPromise) {
    clientPromise = global._cfgMongo = new MongoClient(env('MONGO_URL')).connect();
  }
  return clientPromise.then(c => c.db('payersub').collection('config'));
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const col = await getCol();
    if (req.method === 'GET') {
      const doc = (await col.findOne({ _id: 'app' })) || {};
      delete doc._id;
      return res.status(200).json(doc);
    }
    if (req.method === 'POST') {
      const user = verifyInitData(req.headers['x-telegram-init-data']);
      if (!user || String(user.id) !== String(env('ADMIN_ID'))) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const set = {};
      for (const k of KEYS) {
        if (body[k] === undefined) continue;
        if (k === 'videos') {
          const v = cleanVideos(body.videos);
          if (!v) return res.status(400).json({ error: 'videos noto\'g\'ri' });
          set.videos = v;
        } else if (JSON.stringify(body[k]).length < 200000) {
          set[k] = body[k];
        }
      }
      await col.updateOne({ _id: 'app' }, { $set: set }, { upsert: true });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
