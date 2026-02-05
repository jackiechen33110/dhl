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

// 中间件：检查管理员权限
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
  }
  next();
};

// 获取所有客户
router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, customer_code, name, remark, created_at FROM customers ORDER BY created_at DESC LIMIT 500'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 创建客户
router.post('/', requireAdmin, async (req, res) => {
  const { customer_code, name, remark } = req.body;

  if (!customer_code || !name) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO customers (customer_code, name, remark) VALUES (?, ?, ?)',
      [customer_code, name, remark || null]
    );

    res.json({ ok: true, customer_id: result.insertId });
  } catch (err) {
    console.error('Error creating customer:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ ok: false, error: 'DUPLICATE_CUSTOMER_CODE' });
    }
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 删除客户
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  if (!id) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  }

  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
