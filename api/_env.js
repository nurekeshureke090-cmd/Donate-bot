// ============================================================
//  SIRLAR SHU YERGA YOZILADI (faqat shu faylni tahrirlaysiz)
//  MUHIM: GitHub repongiz PRIVATE (yopiq) bo'lishi shart!
//  Vercel Environment Variables'da bor qiymat shu yerdagidan ustun turadi.
// ============================================================
const FALLBACK = {
  BOT_TOKEN: '8914170959:AAEXGpAD0fIFWMV6S-Wr_mFw3A5utpUUqAc',          // @BotFather bergan token
  MONGO_URL: 'mongodb+srv://nurekeshureke090_db_user:qKFmlTnxjnAe27Gi@cluster0.1dcdbiw.mongodb.net/payersub?retryWrites=true&w=mwardjority',          // mongodb+srv://...
  ADMIN_ID: '8467707826', // sizning Telegram ID
  PLAYPAY_API_KEY: 'pp_30423aa1e19e3c83031a92f3938f7760822e1f4ce025bc1a'     // PlayPay'dan olingan YANGI kalit
};

import crypto from 'crypto';

export const env = (key) => process.env[key] || FALLBACK[key] || '';

// Telegram Mini App initData tekshiruvi (soxtalashtirib bo'lmaydi)
export function verifyInitData(initData) {
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
