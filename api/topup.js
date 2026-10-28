// api/topup.js — To'lov so'rovlarini MongoDB 'transactions' kolleksiyasiga saqlash
const FALLBACK = {
  MONGO_URL: 'mongodb+srv://nurekeshureke090_db_user:qKFmlTnxjnAe27Gi@cluster0.1dcdbiw.mongodb.net/payersub?retryWrites=true&w=majority',
  DB_NAME: 'payersub'
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
    if (!mongoUrl) throw new Error('MONGO_URL topilmadi.');
    const { MongoClient } = await import('mongodb');
    global._mongoClient = new MongoClient(fixMongoUrl(mongoUrl), {
      serverSelectionTimeoutMS: 6000
    }).connect();
  }
  const client = await global._mongoClient;
  return client.db(getEnv('DB_NAME') || 'payersub');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();
    const transactionsCol = db.collection('transactions');

    // GET so'rovi: Foydalanuvchi balansi va tranzaksiyalarini qaytarish
    if (req.method === 'GET') {
      const status = req.query?.status;
      const userId = req.query?.userId;
      const filter = {};

      if (status) filter.status = status;
      if (userId) {
        filter.$or = [
          { userId: String(userId) },
          { telegram_id: Number(userId) || String(userId) }
        ];
      }

      const list = await transactionsCol
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      // Foydalanuvchi balansi va ma'lumotlarini MongoDB 'users' kolleksiyasidan olish
      let userDoc = null;
      if (userId) {
        const usersCol = db.collection('users');
        userDoc = await usersCol.findOne({
          $or: [
            { telegram_id: Number(userId) },
            { telegram_id: String(userId) },
            { telegramId: String(userId) },
            { id: String(userId) },
            { id: Number(userId) }
          ]
        });
      }

      return res.status(200).json({
        ok: true,
        balance: userDoc ? (userDoc.balance ?? 0) : null,
        user: userDoc,
        data: list
      });
    }

    // POST so'rovi: Yangi to'lov so'rovini saqlash
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {
          return res.status(400).json({ ok: false, error: 'Invalid JSON body format.' });
        }
      }
      body = body || {};

      const rawExact = body.exactAmount;
      const exactAmount = parseInt(rawExact, 10);

      if (!rawExact || isNaN(exactAmount) || exactAmount <= 0) {
        return res.status(400).json({
          ok: false,
          error: 'Bad Request: "exactAmount" is required and must be a positive integer.'
        });
      }

      const rawBase = body.baseAmount || body.amount;
      const baseAmount = parseInt(rawBase, 10) || exactAmount;
      const pennies = parseInt(body.pennies, 10) || (exactAmount - baseAmount);

      const targetUserId = String(body.userId || body.telegram_id || 'unknown');
      const txId = body.id || ('TX' + Math.floor(100000 + Math.random() * 900000));
      const now = new Date();

      const newTransaction = {
        id: txId,
        userId: targetUserId,
        telegram_id: isNaN(Number(targetUserId)) ? targetUserId : Number(targetUserId),
        telegramId: targetUserId,
        userName: String(body.userName || 'Foydalanuvchi'),
        userHandle: String(body.userHandle || ''),
        baseAmount: baseAmount,
        exactAmount: exactAmount,
        amount: baseAmount,
        pennies: pennies,
        method: String(body.method || 'UZCARD').toUpperCase(),
        receiptImage: body.receiptImage || null,
        date: body.date || now.toLocaleString('uz-UZ'),
        status: 'pending',
        createdAt: now
      };

      const result = await transactionsCol.insertOne(newTransaction);

      return res.status(201).json({
        ok: true,
        message: "To'lov so'rovi MongoDB'ga muvaffaqiyatli saqlandi.",
        transactionId: txId,
        insertedId: result.insertedId,
        exactAmount: exactAmount,
        status: 'pending'
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed.` });

  } catch (error) {
    console.error('Error in /api/topup:', error);
    return res.status(500).json({ ok: false, error: 'Internal Server Error', details: error.message });
  }
}
