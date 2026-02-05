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

// 获取 CN23 产品库
router.get('/products', requireLogin, async (req, res) => {
  const { q } = req.query;

  try {
    let sql = 'SELECT * FROM cn23_product_library WHERE active = TRUE';
    const params = [];

    if (q) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR hs_code LIKE ?)';
      const likePattern = `%${q}%`;
      params.push(likePattern, likePattern, likePattern);
    }

    sql += ' ORDER BY name ASC LIMIT 200';

    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Error fetching CN23 products:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 创建 CN23 产品
router.post('/products', requireLogin, async (req, res) => {
  const {
    name,
    description,
    hs_code,
    origin_country,
    net_weight_kg,
    unit_value,
    currency,
  } = req.body;

  if (!name) {
    return res.status(400).json({ ok: false, error: 'NAME_REQUIRED' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO cn23_product_library 
       (name, description, hs_code, origin_country, net_weight_kg, unit_value, currency, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        name,
        description || null,
        hs_code || null,
        origin_country || 'CN',
        net_weight_kg || null,
        unit_value || null,
        currency || 'EUR',
      ]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error creating CN23 product:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 更新 CN23 产品
router.put('/products/:id', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);
  const fields = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  }

  try {
    const sets = [];
    const params = [];

    Object.keys(fields).forEach((key) => {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    });

    params.push(id);

    const sql = `UPDATE cn23_product_library SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;

    await pool.query(sql, params);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating CN23 product:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 删除 CN23 产品
router.delete('/products/:id', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);

  if (!id) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  }

  try {
    await pool.query('DELETE FROM cn23_product_library WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting CN23 product:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取或创建 CN23 表单
router.get('/forms/:shipment_id', requireLogin, async (req, res) => {
  const shipment_id = parseInt(req.params.shipment_id);

  if (!shipment_id) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM cn23_forms WHERE shipment_id = ?',
      [shipment_id]
    );

    if (rows.length === 0) {
      return res.json({ ok: true, data: null });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching CN23 form:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 保存 CN23 表单
router.post('/forms/:shipment_id', requireLogin, async (req, res) => {
  const shipment_id = parseInt(req.params.shipment_id);
  const { total_value, currency, reason_for_export, incoterm, form_data } = req.body;

  if (!shipment_id) {
    return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM cn23_forms WHERE shipment_id = ?',
      [shipment_id]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE cn23_forms 
         SET total_value = ?, currency = ?, reason_for_export = ?, incoterm = ?, form_data = ?
         WHERE shipment_id = ?`,
        [
          total_value || null,
          currency || 'EUR',
          reason_for_export || null,
          incoterm || null,
          JSON.stringify(form_data) || null,
          shipment_id,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO cn23_forms 
         (shipment_id, total_value, currency, reason_for_export, incoterm, form_data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          shipment_id,
          total_value || null,
          currency || 'EUR',
          reason_for_export || null,
          incoterm || null,
          JSON.stringify(form_data) || null,
        ]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving CN23 form:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
