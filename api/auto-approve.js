    // 3. exactAmount parametrini qat'iy butun son (Number) sifatida olish
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

    // 5. Qat'iy butun son (Number) orqali pending tranzaksiyani izlash
    let pendingTx = await transactionsCol.findOne({
      exactAmount: exactAmount,
      status: { $in: ['pending', 'Kutilmoqda'] }
    });

    // Fallback 1: Agar avval string sifatida saqlangan bo'lsa
    if (!pendingTx) {
      pendingTx = await transactionsCol.findOne({
        exactAmount: String(exactAmount),
        status: { $in: ['pending', 'Kutilmoqda'] }
      });
    }

    // Fallback 2: Agar orders kolleksiyasida bo'lsa
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
