// api/topup.js — To'lov so'rovlari va Admin amallarini MongoDB'ga sinxronlash
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
    const usersCol = db.collection('users');
    const now = new Date();

    // GET so'rovi: Foydalanuvchi balansi va tranzaksiyalarini MongoDB'dan olish
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

      let userDoc = null;
      if (userId) {
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

    // POST so'rovi: Yangi to'lov yoki Admin amallari
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {
          return res.status(400).json({ ok: false, error: 'Invalid JSON body format.' });
        }
      }
      body = body || {};

      // AMAL 1: Admin paneldan balans qo'shish yoki yechish (Barcha qurilmalarda ko'rinadi)
      if (body.action === 'adjust_balance') {
        const targetUserId = String(body.userId);
        const amount = parseInt(body.amount, 10) || 0;
        const type = body.type; // 'add' yoki 'deduct'
        const delta = type === 'deduct' ? -Math.abs(amount) : Math.abs(amount);

        const userUpdate = await usersCol.findOneAndUpdate(
          {
            $or: [
              { telegram_id: Number(targetUserId) },
              { telegram_id: String(targetUserId) },
              { telegramId: String(targetUserId) },
              { id: String(targetUserId) },
              { id: Number(targetUserId) }
            ]
          },
          {
            $inc: { balance: delta },
            $set: {
              telegram_id: isNaN(Number(targetUserId)) ? String(targetUserId) : Number(targetUserId),
              telegramId: String(targetUserId),
              id: String(targetUserId),
              last_updated: now,
              updatedAt: now
            }
          },
          { returnDocument: 'after', upsert: true }
        );

        const updatedUser = userUpdate?.value || userUpdate;
        return res.status(200).json({
          ok: true,
          message: "Foydalanuvchi balansi MongoDB'da yangilandi.",
          userId: targetUserId,
          newBalance: updatedUser?.balance ?? 0
        });
      }

      // AMAL 2: Admin tomonidan to'lov so'rovini qo'lda tasdiqlash
      if (body.action === 'approve_transaction') {
        const txId = String(body.transactionId);
        const targetUserId = String(body.userId);
        const amount = parseInt(body.amount, 10) || 0;

        await transactionsCol.updateOne(
          { id: txId },
          { $set: { status: 'approved', resolvedAt: now, approvedAt: now, approvalType: 'manual_admin' } }
        );

        const userUpdate = await usersCol.findOneAndUpdate(
          {
            $or: [
              { telegram_id: Number(targetUserId) },
              { telegram_id: String(targetUserId) },
              { telegramId: String(targetUserId) },
              { id: String(targetUserId) },
              { id: Number(targetUserId) }
            ]
          },
          {
            $inc: { balance: amount },
            $set: {
              telegram_id: isNaN(Number(targetUserId)) ? String(targetUserId) : Number(targetUserId),
              telegramId: String(targetUserId),
              id: String(targetUserId),
              last_updated: now,
              updatedAt: now
            }
          },
          { returnDocument: 'after', upsert: true }
        );

        const updatedUser = userUpdate?.value || userUpdate;
        return res.status(200).json({
          ok: true,
          message: "Tranzaksiya tasdiqlandi va balans MongoDB'da yangilandi.",
          newBalance: updatedUser?.balance ?? 0
        });
      }

      // AMAL 3: Yangi to'ldirish so'rovini saqlash
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
