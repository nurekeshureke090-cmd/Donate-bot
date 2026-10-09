// api/proxy.js — YAGONA fayl: PlayPay proxy + umumiy sozlamalar (/_config)
// ============================================================
//  SIRLARNI SHU YERGA YOZING (GitHub repo PRIVATE bo'lsin!)
//  Vercel Environment Variables'da bor qiymat shu yerdagidan ustun turadi.
// ============================================================
const FALLBACK = {
  BOT_TOKEN: '',          // @BotFather bergan token
  MONGO_URL: '',          // mongodb+srv://...
  ADMIN_ID: '8467707826', // sizning Telegram ID
  PLAYPAY_API_KEY: ''     // PlayPay'dan olingan YANGI kalit
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
