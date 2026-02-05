import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 获取所有轨迹（分页）
router.get('/list', async (req, res) => {
  const { page = 1, limit = 20, status, customer_id } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT 
        s.id, s.order_no, s.dhl_tracking_no, s.country, s.status,
        c.name as customer_name,
        st.status as tracking_status, st.location, st.timestamp,
        sr.settlement_status, sr.no_tracking_days
      FROM shipments s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN shipment_tracking st ON s.id = st.shipment_id
      LEFT JOIN settlement_records sr ON s.id = sr.shipment_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND st.status = ?';
      params.push(status);
    }

    if (customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY st.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM shipments s WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND s.status = ?';
      countParams.push(status);
    }

    if (customer_id) {
      countQuery += ' AND s.customer_id = ?';
      countParams.push(customer_id);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      ok: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Tracking list error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取单个回邮单的轨迹详情
router.get('/detail/:shipment_id', async (req, res) => {
  const { shipment_id } = req.params;

  try {
    // 获取回邮单信息
    const [shipmentRows] = await pool.query(
      'SELECT * FROM shipments WHERE id = ?',
      [shipment_id]
    );

    if (shipmentRows.length === 0) {
      return res.status(404).json({ ok: false, error: 'SHIPMENT_NOT_FOUND' });
    }

    const shipment = shipmentRows[0];

    // 获取轨迹记录
    const [trackingRows] = await pool.query(
      'SELECT * FROM shipment_tracking WHERE shipment_id = ? ORDER BY timestamp DESC',
      [shipment_id]
    );

    // 获取结算记录
    const [settlementRows] = await pool.query(
      'SELECT * FROM settlement_records WHERE shipment_id = ?',
      [shipment_id]
    );

    res.json({
      ok: true,
      shipment,
      tracking: trackingRows,
      settlement: settlementRows[0] || null
    });
  } catch (err) {
    console.error('Tracking detail error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 添加轨迹记录
router.post('/add', async (req, res) => {
  const { shipment_id, dhl_tracking_no, status, location, description } = req.body;

  if (!shipment_id || !status) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO shipment_tracking (shipment_id, dhl_tracking_no, status, location, description, timestamp) VALUES (?, ?, ?, ?, ?, NOW())',
      [shipment_id, dhl_tracking_no, status, location, description]
    );

    // 更新结算记录中的最后轨迹时间
    if (status !== 'pending') {
      await pool.query(
        'UPDATE settlement_records SET last_tracking_date = NOW(), no_tracking_days = 0 WHERE shipment_id = ?',
        [shipment_id]
      );
    }

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Add tracking error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 获取需要结算的回邮单（3个月无轨迹）
router.get('/settlement-pending', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id, s.order_no, s.dhl_tracking_no, s.country,
        c.name as customer_name,
        sr.no_tracking_days, sr.last_tracking_date,
        DATEDIFF(NOW(), sr.last_tracking_date) as days_without_tracking
      FROM shipments s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN settlement_records sr ON s.id = sr.shipment_id
      WHERE sr.settlement_status = 'no_tracking'
        AND DATEDIFF(NOW(), sr.last_tracking_date) >= 90
      ORDER BY sr.last_tracking_date ASC
    `);

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Settlement pending error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 生成退款单
router.post('/generate-refund', async (req, res) => {
  const { shipment_id, refund_amount, reason } = req.body;

  if (!shipment_id || !refund_amount) {
    return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
  }

  try {
    await pool.query(
      `UPDATE settlement_records 
       SET settlement_status = 'refunded', 
           refund_date = NOW(), 
           refund_amount = ?,
           refund_reason = ?
       WHERE shipment_id = ?`,
      [refund_amount, reason, shipment_id]
    );

    res.json({ ok: true, message: 'Refund generated successfully' });
  } catch (err) {
    console.error('Generate refund error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

// 自动检查并更新无轨迹状态（定时任务调用）
router.post('/check-no-tracking', async (req, res) => {
  try {
    // 查找最后轨迹超过90天的回邮单
    const [rows] = await pool.query(`
      SELECT s.id, sr.id as settlement_id
      FROM shipments s
      LEFT JOIN settlement_records sr ON s.id = sr.shipment_id
      WHERE sr.settlement_status != 'refunded'
        AND DATEDIFF(NOW(), sr.last_tracking_date) >= 90
    `);

    let updated = 0;
    for (const row of rows) {
      await pool.query(
        'UPDATE settlement_records SET settlement_status = ? WHERE id = ?',
        ['no_tracking', row.settlement_id]
      );
      updated++;
    }

    res.json({ ok: true, updated });
  } catch (err) {
    console.error('Check no tracking error:', err);
    res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

export default router;
