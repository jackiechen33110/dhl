import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dhl_retour',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试连接
pool
  .getConnection()
  .then((conn) => {
    console.log('✓ MySQL 数据库连接成功');
    conn.release();
  })
  .catch((err) => {
    console.error('✗ MySQL 数据库连接失败:', err.message);
  });

export default pool;
