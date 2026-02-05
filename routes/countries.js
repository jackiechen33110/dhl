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

// 获取所有国家规则
router.get('/', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT iso2, iso3, english_name, chinese_name, cn23_required FROM country_rules ORDER BY english_name'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error fetching country rules:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取需要 CN23 的国家
router.get('/cn23', requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT iso2, iso3, english_name, chinese_name FROM country_rules WHERE cn23_required = TRUE ORDER BY english_name'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error fetching CN23 countries:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
