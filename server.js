import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

// 导入路由
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import shipmentRoutes from './routes/shipments.js';
import countryRoutes from './routes/countries.js';
import cn23Routes from './routes/cn23.js';
import logsRoutes from './routes/logs.js';
import trackingRoutes from './routes/tracking.js';
import quotationRoutes from './routes/quotations.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件配置 =====

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 请求解析
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

// Session 配置
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dhl-retour-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 小时
    },
  })
);

// EJS 模板引擎配置
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 全局中间件：将用户信息传递给模板
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  next();
});

// 中间件：检查登录
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// ===== 路由 =====

// 首页重定向
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// 登录页面
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'DHL 回邮单系统 - 登录' });
});

// 仪表板
app.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { title: 'DHL 回邮单系统 - 仪表板' });
});

// 客户管理页面
app.get('/customers', requireLogin, (req, res) => {
  res.render('customers', { title: '客户管理' });
});

// 回邮单页面
app.get('/shipments', requireLogin, (req, res) => {
  res.render('shipments/list', { title: '回邮单列表' });
});

app.get('/shipments/import', requireLogin, (req, res) => {
  res.render('shipments/import', { title: '导入回邮单' });
});

app.get('/shipments/:id', requireLogin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = (await import('./db.js')).default;
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).render('404', { title: '回邮单未找到' });
    }

    res.render('shipments/detail', { 
      title: '回邮单详情',
      shipment: rows[0]
    });
  } catch (err) {
    console.error('Error loading shipment:', err);
    res.status(500).render('error', {
      title: '服务器错误',
      error: '加载回邮单失败'
    });
  }
});

app.get('/shipments/:id/cn23', requireLogin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = (await import('./db.js')).default;
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).render('404', { title: '回邮单未找到' });
    }

    res.render('shipments/cn23', { 
      title: 'CN23 报关单',
      shipment: rows[0]
    });
  } catch (err) {
    console.error('Error loading CN23 form:', err);
    res.status(500).render('error', {
      title: '服务器错误',
      error: '加载 CN23 表单失败'
    });
  }
});

// 统计汇总页面
app.get('/summary', requireLogin, (req, res) => {
  res.render('summary', { title: '统计汇总' });
});

// 轨迹追踪页面
app.get('/tracking', requireLogin, (req, res) => {
  res.render('tracking', { title: '轨迹追踪' });
});

// 结算管理页面
app.get('/settlement', requireLogin, (req, res) => {
  res.render('settlement', { title: '结算管理' });
});

// 报价管理页面
app.get('/quotations', requireLogin, (req, res) => {
  res.render('quotations', { title: '报价管理' });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/cn23', cn23Routes);
app.use('/api/logs', logsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/quotations', quotationRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', {
    title: '服务器错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器发生错误',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`DHL 回邮单系统运行在 http://localhost:${PORT}`);
});
