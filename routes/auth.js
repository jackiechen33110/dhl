import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 默认用户数据（用于沙盒测试）
const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password_hash: 'admin123',
    full_name: '系统管理员',
    email: 'admin@dhl.local',
    role: 'admin'
  },
  {
    id: 2,
    username: 'staff',
    password_hash: 'staff123',
    full_name: '普通员工',
    email: 'staff@dhl.local',
    role: 'staff'
  }
];

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    // 首先尝试从数据库查询
    let user = null;
    try {
      const [rows] = await pool.query(
        'SELECT id, username, full_name, role FROM users WHERE username = ? AND password_hash = ?',
        [username, password]
      );
      if (rows.length > 0) {
        user = rows[0];
      }
    } catch (dbErr) {
      // 数据库连接失败，使用默认用户
      console.log('Database unavailable, using default users');
    }

    // 如果数据库查询失败或无结果，使用默认用户
    if (!user) {
      const defaultUser = defaultUsers.find(
        u => u.username === username && u.password_hash === password
      );
      user = defaultUser;
    }

    if (!user) {
      return res.status(400).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    };

    res.json({ ok: true, user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// 获取当前用户
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.json({ ok: false, user: null });
  }
  res.json({ ok: true, user: req.session.user });
});

// 登出
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'LOGOUT_FAILED' });
    }
    res.json({ ok: true });
  });
});

export default router;
