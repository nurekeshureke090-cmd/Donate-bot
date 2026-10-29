// api/proxy.js — YAGONA fayl: PlayPay proxy + umumiy sozlamalar (/_config)
// ============================================================
//  SIRLARNI SHU YERGA YOZING (GitHub repo PRIVATE bo'lsin!)
//  Vercel Environment Variables'da bor qiymat shu yerdagidan ustun turadi.
// ============================================================
const FALLBACK = {
  BOT_TOKEN: '8914170959:AAEXGpAD0fIFWMV6S-Wr_mFw3A5utpUUqAc',          
  MONGO_URL: 'mongodb+srv://nurekeshureke090_db_user:qKFmlTnxjnAe27Gi@cluster0.1dcdbiw',          
  ADMIN_ID: '8467707826', 
  PLAYPAY_API_KEY: 'pp_30423aa1e19e3c83031a92f3938f7760822e1f4ce025bc1a',
  UZPINHUB_API_KEY: '3d1170b6-a9e5-4bd6-af5e-3955fafb8dda'
};

import crypto from 'crypto';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { Address, beginCell } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';

const env = (k) => (k === 'ADMIN_ID' && FALLBACK.ADMIN_ID) ? FALLBACK.ADMIN_ID : (process.env[k] || FALLBACK[k] || '');
const PLAYPAY_API = 'https://playpay.uz/api/v1';
const UZPINHUB_API = 'https://api.uzpinhub.uz/api';

const GET_PUBLIC = [/^\/games$/, /^\/games\/\d+\/packages$/, /^\/_config$/];
const GET_USER = [/^\/order\/[\w-]+$/];
const POST_USER = ['/check_id', '/order'];
const CFG_KEYS = ['videos', 'faqs', 'cardSettings', 'priceMarkups', 'vipSettings', 'referralSettings', 'dailyBonusSettings', 'notifications', 'contests', 'banners'];

function checkInitData(initData) {
  const botToken = env('BOT_TOKEN');
  if (!botToken) return { reason: "Serverda BOT_TOKEN yo'q (api/proxy.js yoki Vercel)" };
  if (!initData) return { reason: "Telegram ma'lumoti kelmadi: ilovani bot ichidan oching" };
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return { reason: "Telegram imzosi yo'q" };
  p.delete('hash');
  const check = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken.trim()).digest();
  const calc = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) {
    return { reason: "BOT_TOKEN shu botniki emas" };
  }
  if (Date.now() / 1000 - Number(p.get('auth_date') || 0) > 86400) {
    return { reason: 'Sessiya eskirgan' };
  }
  try { return { user: JSON.parse(p.get('user')) }; } catch { return { reason: "Buzuq ma'lumot" }; }
}

function fixMongoUrl(u) {
  return String(u).trim().replace(/([?&])w=[^&]*/i, '$1w=majority').replace(/([?&])retryWrites=[^&]*/i, '$1retryWrites=true');
}

async function getCol() {
  if (!global._cfgMongo) {
    if (!env('MONGO_URL')) throw new Error('MONGO_URL yoq');
    const { MongoClient } = await import('mongodb');   
    global._cfgMongo = new MongoClient(fixMongoUrl(env('MONGO_URL')), { serverSelectionTimeoutMS: 6000 }).connect();
  }
  let c;
  try { c = await global._cfgMongo; } catch (e) { global._cfgMongo = null; throw e; } 
  return c.db('payersub').collection('config');
}

function cleanVideos(v) {
  if (!Array.isArray(v) || v.length > 50) return null;
  return v.map(x => ({ id: Number(x.id) || Date.now(), title: String(x.title || '').slice(0, 120), duration: String(x.duration || '').slice(0, 40), url: String(x.url || '').slice(0, 500) }));
}
function cleanBanners(v) {
  if (!Array.isArray(v) || v.length > 10) return null;
  return v.map(x => ({ id: Number(x.id) || Date.now(), image: String(x.image || '').slice(0, 500), link: String(x.link || '').slice(0, 500) })).filter(x => x.image);
}

async function handleConfig(req, res, auth) {
  try {
    if (req.method === 'POST') {
      const user = auth.user;
      if (!user || String(user.id) !== String(env('ADMIN_ID')).trim()) return res.status(403).json({ error: 'Ruxsat yoq' });
    }
    const col = await getCol();
    if (req.method === 'GET') {
      const doc = (await col.findOne({ _id: 'app' })) || {};
      delete doc._id;
      return res.status(200).json(doc);
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const set = {};
    for (const k of CFG_KEYS) {
      if (body[k] === undefined) continue;
      if (k === 'videos') set.videos = cleanVideos(body.videos);
      else if (k === 'banners') set.banners = cleanBanners(body.banners);
      else set[k] = body[k];
    }
    await col.updateOne({ _id: 'app' }, { $set: set }, { upsert: true });
    return res.status(200).json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'Baza xatosi' }); }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const method = req.method;
    if (method !== 'GET' && method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
    const path = String(req.query.path || req.body?.path || '');
    const auth = checkInitData(req.headers['x-telegram-init-data']);
    const user = auth.user || null;
    const isAdmin = user && String(user.id) === String(env('ADMIN_ID')).trim();

    if (path === '/_config') return handleConfig(req, res, auth);

    // ════════════════════════════════════════════════════════════
    //  /order-stars — Fragment + TON Blockchain Integration (Anti-bot aylanib o'tish)
    // ════════════════════════════════════════════════════════════
    if (path === '/order-stars' && method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') try { b = JSON.parse(b); } catch(e){}
      let d = b?.data || b || {};
      if (typeof d === 'string') try { d = JSON.parse(d); } catch(e){}
      
      const username = d?.username || b?.username;
      const quantity = d?.quantity || b?.quantity;
      if (!username || !quantity) return res.status(400).json({ ok: false, error: 'username va quantity majburiy' });

      try {
        const mnemonic = (process.env.TON_MNEMONIC || '').trim().split(/\s+/);
        if (mnemonic.length < 12) throw new Error("TON_MNEMONIC xato");
        const fragmentHash = (process.env.FRAGMENT_API_HASH || '').trim();
        const fragmentCookie = (process.env.FRAGMENT_COOKIE || '').trim();
        if (!fragmentHash || !fragmentCookie) throw new Error('FRAGMENT kalitlari yoq');

        const FRAGMENT_API_URL = `https://fragment.com/api?hash=${fragmentHash}`;
        
        // KOMPYUTERINGIZ BILAN 100% BIR XIL QILINGAN HEADERS
        const FRAGMENT_HEADERS = {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': fragmentCookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Origin': 'https://fragment.com',
          'Referer': 'https://fragment.com/stars',
          'sec-ch-ua': '"Google Chrome";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'priority': 'u=1, i'
        };

        async function callFragment(apiMethod, data) {
          const params = new URLSearchParams();
          params.append('method', apiMethod);
          for (const [k, v] of Object.entries(data)) {
            params.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
          }
          const resp = await fetch(FRAGMENT_API_URL, {
            method: 'POST',
            headers: FRAGMENT_HEADERS,
            body: params
          });
          if (!resp.ok) throw new Error(`Fragment HTTP ${resp.status}`);
          const json = await resp.json();
          if (json.error) throw new Error(`Fragment xatosi: ${json.error}`);
          return json;
        }

        const cleanUsername = String(username).replace(/^@/, '');
        const recipientRes = await callFragment('searchStarsRecipient', { query: cleanUsername });
        const recipientToken = recipientRes?.found?.recipient;
        if (!recipientToken) throw new Error(`Topilmadi: @${cleanUsername}`);

        const initRes = await callFragment('initBuyStarsRequest', { recipient: recipientToken, quantity: String(quantity), payment_method: 'ton' });
        const requestId = initRes.req_id || initRes.request_id || initRes.id;
        
        const keyPair = await mnemonicToPrivateKey(mnemonic);
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const linkRes = await callFragment('getBuyStarsLink', { request_id: requestId, address: wallet.address.toString() });

        const destAddress = linkRes.address || linkRes.destination;
        const amountNano = linkRes.amount;  
        const payloadComment = linkRes.payload || linkRes.comment || '';

        const tonClient = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
        const walletContract = tonClient.open(wallet);
        const seqno = await walletContract.getSeqno();

        const bodyCell = beginCell().storeUint(0, 32).storeStringTail(payloadComment).endCell();
        await walletContract.sendTransfer({
          seqno, secretKey: keyPair.secretKey,
          messages: [ internal({ to: Address.parse(destAddress), value: BigInt(amountNano), bounce: true, body: bodyCell }) ]
        });

        return res.status(200).json({ ok: true, message: 'Telegram Stars muvaffaqiyatli xarid qilindi' });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message || "Xato" });
      }
    }

    // ============================================================
    //  UZPINHUB INTEGRATION (/uzpin/...)
    // ============================================================
    if (path.startsWith('/uzpin')) {
      const uzpinKey = env('UZPINHUB_API_KEY') || '3d1170b6-a9e5-4bd6-af5e-3955fafb8dda';
      let subpath = path.replace(/^\/uzpin\/?/, '');
      let bodyData = req.body?.data || req.body || {};
      if (typeof bodyData === 'string') try { bodyData = JSON.parse(bodyData); } catch (e) {}

      if (subpath === 'stars/buy') {
        subpath = 'order/telegram/buy';
        if (!bodyData.external_order_id) bodyData.external_order_id = crypto.randomUUID();
        if (bodyData.username) bodyData.username = String(bodyData.username).replace(/^@/, '').trim();
      } else if (subpath === 'stars/check') {
        subpath = 'order/telegram/check-username';
        if (bodyData.username) bodyData.username = String(bodyData.username).replace(/^@/, '').trim();
      } else if (subpath === 'topup/buy') {
        subpath = 'order/topup/buy';
        if (!bodyData.external_order_id) bodyData.external_order_id = crypto.randomUUID();
      } else if (subpath === 'steam/buy') {
        subpath = 'order/steam-topup/buy';
        if (!bodyData.external_order_id) bodyData.external_order_id = crypto.randomUUID();
      }

      const uzpinUrl = `${UZPINHUB_API}/${subpath}`;
      const uzpinOptions = {
        method,
        headers: {
          'X-Api-Key': uzpinKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      };
      if (method === 'POST') {
        uzpinOptions.body = JSON.stringify(bodyData);
      }

      const uzpinRes = await fetch(uzpinUrl, uzpinOptions);
      const uzpinData = await uzpinRes.json();
      return res.status(uzpinRes.status).json(uzpinData);
    }

    // ============================================================
    //  PLAYPAY INTEGRATION (Default)
    // ============================================================
    const apiKey = env('PLAYPAY_API_KEY');
    if (!apiKey) return res.status(500).json({ error: 'PLAYPAY_API_KEY yoq' });

    let url = `${PLAYPAY_API}${path}`;
    if (method === 'GET') url += '?currency=UZS';
    const options = { method, headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } };
    if (method === 'POST' && req.body?.data) options.body = JSON.stringify(req.body.data);

    const response = await fetch(url, options);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) { return res.status(500).json({ error: 'Server xatosi' }); }
}
