// api/auto-approve.js — Bank SMS orqali to'lovlarni 100% avtomatik tasdiqlash endpointi
import crypto from 'crypto';

// Fallback konfiguratsiya (Vercel Environment Variables ustun turadi)
const FALLBACK = {
  BOT_TOKEN: '8914170959:AAEXGpAD0fIFWMV6S-Wr_mFw3A5utpUUqAc',
  MONGO_URL: 'mongodb+srv://nurekeshureke090_db_user:qKFmlTnxjnAe27Gi@cluster0.1dcdbiw.mongodb.net/payersub?retryWrites=true&w=majority',
  DB_NAME: 'payersub',
  AUTO_APPROVE_SECRET: 'YOUR_SECRET_KEY'
};

const getEnv = (key) => process.env[key] || FALLBACK[key] || '';

function fixMongoUrl(url) {
  return String(url)
    .trim()
    .replace(/([?&])w=[^&]*/i, '$1w=majority')
    .replace(/([?&])retryWrites=[^&]*/i, '$1retryWrites=true');
}

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

function isAuthorized(req) {
  const secretKey = getEnv('AUTO_APPROVE_SECRET');
  if (!secretKey) return false;

  const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || '';
  if (!authHeader) return false;

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Only POST is accepted.`
    });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized: Invalid or missing secret authorization token.'
    });
  }

  try {
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
    const exactAmount = Number(rawAmount);

    if (rawAmount === undefined || rawAmount === null || isNaN(exactAmount) || exactAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Bad Request: "exactAmount" is required and must be a positive integer/number.'
      });
    }

    const db = await getDb();
    const transactionsCol = db.collection('transactions');
    const usersCol = db.collection('users');

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

    // Tranzaksiyani atomik tarzda 'approved' qilish
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
    if (!updatedTxDoc || updatedTxDoc.status !== 'approved') {
      return res.status(409).json({
        ok: false,
        error: 'Conflict: Transaction has already been approved or processed.'
      });
    }

    const targetTelegramId = pendingTx.telegram_id || pendingTx.telegramId || pendingTx.userId || pendingTx.user_id;

    if (!targetTelegramId) {
      return res.status(422).json({
        ok: false,
        error: 'Transaction record is missing telegramId / userId to credit.'
      });
    }

    // Foydalanuvchi balansini xavfsiz $inc bilan oshirish
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
        $set: { last_updated: now, updatedAt: now }
      },
      { returnDocument: 'after', upsert: true }
    );

    const updatedUser = userUpdateResult?.value || userUpdateResult;
    const newBalance = updatedUser?.balance ?? null;

    // Telegram Bot orqali foydalanuvchiga tabrik xabari
    const botToken = getEnv('BOT_TOKEN');
    const notificationText =
      `✅ <b>To'lovingiz avtomatik tasdiqlandi va balansingizga qo'shildi!</b>\n\n` +
      `💰 <b>Qo'shilgan summa:</b> +${exactAmount.toLocaleString('uz-UZ')} UZS\n` +
      (newBalance != null ? `💳 <b>Yangi balansingiz:</b> ${newBalance.toLocaleString('uz-UZ')} UZS\n` : '') +
      `🆔 <b>Tranzaksiya:</b> <code>#${pendingTx.id || pendingTx._id}</code>\n` +
      `⚡ <i>Holati: Bank SMS orqali 100% avtomatik tasdiqlandi.</i>`;

    const notifResult = await sendTelegramNotification(botToken, targetTelegramId, notificationText);

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
