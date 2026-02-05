import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 中间件：检查登录
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'NOT_LOGGED_IN' });
  }
  next();
};

// 获取回邮单列表
router.get('/', requireLogin, async (req, res) => {
  const { customer_id, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let sql = 'SELECT * FROM shipments WHERE 1=1';
    const params = [];

    if (customer_id) {
      sql += ' AND customer_id = ?';
      params.push(customer_id);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM shipments WHERE 1=1';
    const countParams = [];
    if (customer_id) {
      countSql += ' AND customer_id = ?';
      countParams.push(customer_id);
    }
    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }

    const [countRows] = await pool.query(countSql, countParams);
    const total = countRows[0].total;

    res.json({ ok: true, data: rows, total, page, limit });
  } catch (err) {
    console.error('Error fetching shipments:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 创建回邮单
router.post('/', requireLogin, async (req, res) => {
  const {
    customer_id,
    order_no,
    country,
    city,
    postcode,
    street,
    house_no,
    product,
    quantity,
    declared_value,
    classification,
    need_customs,
  } = req.body;

  if (!customer_id || !country || !city || !postcode || !street) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO shipments 
       (customer_id, order_no, country, city, postcode, street, house_no, product, quantity, declared_value, classification, need_customs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id,
        order_no || null,
        country,
        city,
        postcode,
        street,
        house_no || null,
        product || null,
        quantity || 1,
        declared_value || 0,
        classification || 'UNKNOWN',
        need_customs ? 1 : 0,
      ]
    );

    res.json({ ok: true, shipment_id: result.insertId });
  } catch (err) {
    console.error('Error creating shipment:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 批量创建回邮单
router.post('/bulk', requireLogin, async (req, res) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ ok: false, error: 'INVALID_DATA' });
  }

  try {
    let insertedCount = 0;

    for (const row of rows) {
      const {
        customerId,
        orderNo,
        country,
        city,
        postcode,
        street,
        houseNo,
        product,
        qty,
        value,
        classification,
        needCustoms,
      } = row;

      if (!customerId || !country || !city || !postcode || !street) {
        continue;
      }

      await pool.query(
        `INSERT INTO shipments 
         (customer_id, order_no, country, city, postcode, street, house_no, product, quantity, declared_value, classification, need_customs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          orderNo || null,
          country,
          city,
          postcode,
          street,
          houseNo || null,
          product || null,
          qty || 1,
          value || 0,
          classification || 'UNKNOWN',
          needCustoms ? 1 : 0,
        ]
      );

      insertedCount++;
    }

    res.json({ ok: true, insertedCount });
  } catch (err) {
    console.error('Error bulk creating shipments:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 更新回邮单状态
router.patch('/:id/status', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ ok: false, error: 'INVALID_DATA' });
  }

  try {
    await pool.query('UPDATE shipments SET status = ? WHERE id = ?', [status, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating shipment status:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取回邮单详情
router.get('/:id', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);

  if (!id) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching shipment:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
