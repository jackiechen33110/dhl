import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 获取所有报价
router.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM quotations WHERE is_active = 1 ORDER BY is_default DESC, created_at DESC'
    );

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Quotations list error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取单个报价详情
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM quotations WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'QUOTATION_NOT_FOUND' });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error('Quotation detail error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 创建新报价
router.post('/create', async (req, res) => {
  const { name, description, price, currency = 'EUR', is_default = false } = req.body;

  if (!name || !price) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    // 如果设置为默认，取消其他默认
    if (is_default) {
      await pool.query('UPDATE quotations SET is_default = 0 WHERE is_default = 1');
    }

    const [result] = await pool.query(
      'INSERT INTO quotations (name, description, price, currency, is_default, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name, description, price, currency, is_default ? 1 : 0]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Create quotation error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 编辑报价
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, currency, is_default } = req.body;

  try {
    if (is_default) {
      await pool.query('UPDATE quotations SET is_default = 0 WHERE is_default = 1');
    }

    await pool.query(
      'UPDATE quotations SET name = ?, description = ?, price = ?, currency = ?, is_default = ? WHERE id = ?',
      [name, description, price, currency, is_default ? 1 : 0, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Update quotation error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 删除报价
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE quotations SET is_active = 0 WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete quotation error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 复制报价给指定客户
router.post('/copy-to-customer', async (req, res) => {
  const { quotation_id, customer_id, custom_price } = req.body;

  if (!quotation_id || !customer_id) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    // 检查是否已存在
    const [existing] = await pool.query(
      'SELECT id FROM customer_quotations WHERE customer_id = ? AND quotation_id = ?',
      [customer_id, quotation_id]
    );

    if (existing.length > 0) {
      // 更新现有记录
      await pool.query(
        'UPDATE customer_quotations SET custom_price = ? WHERE customer_id = ? AND quotation_id = ?',
        [custom_price, customer_id, quotation_id]
      );
    } else {
      // 创建新记录
      await pool.query(
        'INSERT INTO customer_quotations (customer_id, quotation_id, custom_price) VALUES (?, ?, ?)',
        [customer_id, quotation_id, custom_price]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Copy quotation error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取客户的定制报价
router.get('/customer/:customer_id', async (req, res) => {
  const { customer_id } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT 
        q.*, 
        cq.custom_price,
        IF(cq.custom_price IS NOT NULL, cq.custom_price, q.price) as final_price
      FROM quotations q
      LEFT JOIN customer_quotations cq ON q.id = cq.quotation_id AND cq.customer_id = ?
      WHERE q.is_active = 1
      ORDER BY q.is_default DESC, q.created_at DESC
    `, [customer_id]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Customer quotations error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 批量获取所有客户的定制报价
router.get('/all/custom', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        q.id as quotation_id,
        q.name as quotation_name,
        q.price as base_price,
        cq.custom_price,
        IF(cq.custom_price IS NOT NULL, cq.custom_price, q.price) as final_price
      FROM customers c
      CROSS JOIN quotations q
      LEFT JOIN customer_quotations cq ON c.id = cq.customer_id AND q.id = cq.quotation_id
      WHERE q.is_active = 1
      ORDER BY c.name, q.is_default DESC
    `);

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('All custom quotations error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
