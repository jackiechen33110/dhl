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

// 获取操作日志
router.get('/', requireLogin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      `SELECT ol.*, u.full_name 
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       ORDER BY ol.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM operation_logs');
    const total = countRows[0].total;

    res.json({ ok: true, data: rows, total, page, limit });
  } catch (err) {
    console.error('Error fetching operation logs:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 记录操作
router.post('/', requireLogin, async (req, res) => {
  const { action, target_type, target_id, details } = req.body;
  const user_id = req.session.user.id;
  const ip = req.ip;

  if (!action) {
    return res.status(400).json({ ok: false, error: 'ACTION_REQUIRED' });
  }

  try {
    await pool.query(
      `INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, action, target_type || null, target_id || null, details || null, ip]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Error logging operation:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
