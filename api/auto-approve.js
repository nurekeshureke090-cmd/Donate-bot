// api/auto-approve.js — Bank SMS orqali to'lovlarni 100% avtomatik tasdiqlash endpointi
// ==============================================================================
// Ushbu Vercel Serverless Function tashqi skript (Bank SMS parser) orqali kelgan
// so'rovni qabul qiladi, xavfsizlik kalitini tekshiradi, MongoDB'dan mos keluvchi
// pending tranzaksiyani topadi, uning statusini 'approved' qiladi, foydalanuvchi
// balansiga exactAmount miqdorini xavfsiz qo'shadi va Telegram bot orqali xabar yuboradi.
// ==============================================================================

import crypto from 'crypto';

// Fallback konfiguratsiya (Vercel Environment Variables ustun turadi)
const FALLBACK = {
  BOT_TOKEN: '8914170959:AAEXGpAD0fIFWMV6S-Wr_mFw3A5utpUUqAc',
  MONGO_URL: 'mongodb+srv://nurekeshureke090_db_user:qKFmlTnxjnAe27Gi@cluster0.1dcdbiw.mongodb.net/payersub?retryWrites=true&w=majority',
  DB_NAME: 'payersub',
  AUTO_APPROVE_SECRET: 'YOUR_SECRET_KEY' // O'zingizning maxfiy kalitingizni Vercel env'ga yozing
};

const getEnv = (key) => process.env[key] || FALLBACK[key] || '';

/**
 * MongoDB URL parametrlarini normallashtirish
 */
function fixMongoUrl(url) {
  return String(url)
    .trim()
    .replace(/([?&])w=[^&]*/i, '$1w=majority')
    .replace(/([?&])retryWrites=[^&]*/i, '$1retryWrites=true');
}

/**
 * MongoDB ulanishi (Serverless so'rovlar orasida keshlanadi)
 */
async function getDb() {
  if (!global._mongoClient) {
    const mongoUrl = getEnv('MONGO_URL') || getEnv('MONGODB_URI');
    if (!mongoUrl) {
      throw new Error('MONGO_URL konfiguratsiyasi topilmadi.');
    }
    const { MongoClient } = await import('mongodb');
    global._mongoClient = new MongoClient(fixMongoUrl(mongoUrl), {
      serverSelectionTimeoutMS: 6000
    }).connect();
  }

  let client;
  try {
    client = await global._mongoClient;
  } catch (err) {
    global._mongoClient = null;
    throw err;
  }

  const dbName = getEnv('DB_NAME') || 'payersub';
  return client.db(dbName);
}

/**
 * Xavfsizlik kalitini tekshirish (Timing Attack himoyasi bilan)
 */
function isAuthorized(req) {
  const secretKey = getEnv('AUTO_APPROVE_SECRET');
  if (!secretKey) return false;

  const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || '';
  if (!authHeader) return false;

  // 'Bearer TOKEN' yoki oddiy 'TOKEN' formatini qabul qilamiz
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) return false;

  try {
    const bufA = Buffer.from(token);
    const bufB = Buffer.from(secretKey);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return token === secretKey;
  }
}

/**
 * Telegram Bot orqali foydalanuvchiga xabarnoma yuborish
 */
async function sendTelegramNotification(botToken, chatId, text) {
  if (!botToken || !chatId) return { sent: false, error: 'Token or ChatID missing' };

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    return { sent: Boolean(data.ok), error: data.description || null };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

/**
 * Asosiy Serverless Handler
 */
export default async function handler(req, res) {
  // CORS sarlavhalari (Zarurat bo'lganda tashqi skriptlar uchun)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Faqat POST so'rovlarni qabul qilish
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Only POST is accepted.`
    });
  }

  // 2. Xavfsizlik: Secret authorization token tekshiruvi
  if (!isAuthorized(req)) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized: Invalid or missing secret authorization token (Expected: "Bearer YOUR_SECRET_KEY").'
    });
  }

  try {
    // 3. Request body'dan exactAmount qiymatini olish va tekshirish
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ ok: false, error: 'Invalid JSON body format.' });
      }
    }
    body = body || {};

    const rawAmount = body.exactAmount;
    // Qat'iy Number(req.body.exactAmount) sifatida butun songa o'tkazish
    const exactAmount = Number(rawAmount);

    if (rawAmount === undefined || rawAmount === null || isNaN(exactAmount) || exactAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Bad Request: "exactAmount" is required and must be a positive integer/number.'
      });
    }

    // 4. MongoDB'ga ulanish
    const db = await getDb();
    const transactionsCol = db.collection('transactions');
    const usersCol = db.collection('users');

    // 5. 'pending' (yoki 'Kutilmoqda') holatidagi va exactAmount mos bo'lgan so'rovni qidirish
    // Qat'iy exactAmount BUTUN SON (integer Number) sifatida izlash
    let pendingTx = await transactionsCol.findOne({
      exactAmount: exactAmount,
      status: { $in: ['pending', 'Kutilmoqda'] }
    });

    // Fallback 1: String ko'rinishida saqlangan bo'lsa
    if (!pendingTx) {
      pendingTx = await transactionsCol.findOne({
        exactAmount: String(exactAmount),
        status: { $in: ['pending', 'Kutilmoqda'] }
      });
    }

    // Fallback 2: orders kolleksiyasida bo'lsa
    if (!pendingTx) {
      const ordersCol = db.collection('orders');
      pendingTx = await ordersCol.findOne({
        $or: [
          { exactAmount: exactAmount },
          { exactAmount: String(exactAmount) }
        ],
        status: { $in: ['pending', 'Kutilmoqda'] }
      });
    }

    if (!pendingTx) {
      console.warn(`[POST /api/auto-approve] Transaction not found for exactAmount: ${exactAmount}`);
      return res.status(404).json({
        ok: false,
        error: 'Transaction not found',
        message: `No pending transaction found matching exactAmount: ${exactAmount}`
      });
    }

    const now = new Date();

    // 6. Tranzaksiyani atomik tarzda 'approved' holatiga o'tkazish (Poyga holati - Race condition oldini olish)
    const updateTxResult = await transactionsCol.findOneAndUpdate(
      {
        _id: pendingTx._id,
        status: { $in: ['pending', 'Kutilmoqda'] }
      },
      {
        $set: {
          status: 'approved',
          resolvedAt: now,
          approvedAt: now,
          approvalType: 'auto_sms'
        }
      },
      { returnDocument: 'after' }
    );

    const updatedTxDoc = updateTxResult?.value || updateTxResult;
    // Agar boshqa parallel so'rov uni tasdiqlab bo'lgan bo'lsa
    if (!updatedTxDoc || updatedTxDoc.status !== 'approved') {
      return res.status(409).json({
        ok: false,
        error: 'Conflict: Transaction has already been approved or processed.'
      });
    }

    // 7. Foydalanuvchi identifikatorini aniqlash (telegram_id, telegramId, userId, user_id)
    const targetTelegramId = pendingTx.telegram_id || pendingTx.telegramId || pendingTx.userId || pendingTx.user_id;

    if (!targetTelegramId) {
      return res.status(422).json({
        ok: false,
        error: 'Transaction record is missing telegramId / userId to credit.'
      });
    }

    // 8. Foydalanuvchi balansini xavfsiz $inc bilan oshirish
    const userFilter = {
      $or: [
        { telegram_id: targetTelegramId },
        { telegram_id: Number(targetTelegramId) },
        { telegramId: String(targetTelegramId) },
        { telegramId: Number(targetTelegramId) },
        { id: String(targetTelegramId) },
        { id: Number(targetTelegramId) }
      ]
    };

    const userUpdateResult = await usersCol.findOneAndUpdate(
      userFilter,
      {
        $inc: { balance: exactAmount },
        $set: {
          telegram_id: isNaN(Number(targetTelegramId)) ? String(targetTelegramId) : Number(targetTelegramId),
          telegramId: String(targetTelegramId),
          id: String(targetTelegramId),
          last_updated: now,
          updatedAt: now
        }
      },
      { returnDocument: 'after', upsert: true }
    );

    const updatedUser = userUpdateResult?.value || userUpdateResult;
    const newBalance = updatedUser?.balance ?? null;

    // 9. Telegram Bot orqali foydalanuvchiga xabarnoma jo'natish
    const botToken = getEnv('BOT_TOKEN');
    const notificationText =
      `✅ <b>To'lovingiz avtomatik tasdiqlandi va balansingizga qo'shildi!</b>\n\n` +
      `💰 <b>Qo'shilgan summa:</b> +${exactAmount.toLocaleString('uz-UZ')} UZS\n` +
      (newBalance != null ? `💳 <b>Yangi balansingiz:</b> ${newBalance.toLocaleString('uz-UZ')} UZS\n` : '') +
      `🆔 <b>Tranzaksiya:</b> <code>#${pendingTx.id || pendingTx._id}</code>\n` +
      `⚡ <i>Holati: Bank SMS orqali 100% avtomatik tasdiqlandi.</i>`;

    const notifResult = await sendTelegramNotification(botToken, targetTelegramId, notificationText);

    // 10. Muvaffaqiyatli javob qaytarish
    return res.status(200).json({
      ok: true,
      message: "To'lov muvaffaqiyatli avtomatik tasdiqlandi va balansga qo'shildi.",
      data: {
        transactionId: pendingTx.id || pendingTx._id,
        exactAmount: exactAmount,
        status: 'approved',
        userId: targetTelegramId,
        newBalance: newBalance,
        notification: notifResult
      }
    });

  } catch (error) {
    console.error('Auto-approve Serverless Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
