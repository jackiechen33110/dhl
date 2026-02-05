# DHL 回邮单系统 - 快速部署清单

## ⚡ 5 分钟快速开始

### 前置条件检查
- [ ] 已安装 Node.js 14+ (`node --version`)
- [ ] 已安装 MySQL 5.7+ (`mysql --version`)
- [ ] 已安装 Git (`git --version`)
- [ ] 有 GitHub 账户访问权限

---

## 📥 步骤 1：获取代码

### 方式 A：Git 克隆（推荐）
```bash
cd C:\
git clone https://github.com/jackiechen33110/dhl.git
cd dhl
```

### 方式 B：手动下载
1. 访问 https://github.com/jackiechen33110/dhl
2. 点击 "Code" → "Download ZIP"
3. 解压到 `C:\dhl-retour-system`
4. 打开命令行进入该目录

---

## 📦 步骤 2：安装依赖

```bash
npm install
```

**预计时间**：2-5 分钟（取决于网络速度）

---

## 🗄️ 步骤 3：初始化数据库

### 3.1 打开 MySQL 命令行
```bash
mysql -u root -p
```
输入 MySQL root 密码

### 3.2 执行初始化脚本
```bash
source C:\dhl-retour-system\sql\init.sql;
```

### 3.3 验证
```sql
USE dhl_retour;
SHOW TABLES;
```
应该看到 12 个表

---

## ⚙️ 步骤 4：配置环境

### 4.1 创建 `.env` 文件

在项目根目录创建 `.env` 文件，内容如下：

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dhl_retour
DB_CHARSET=utf8mb4
SESSION_SECRET=change-this-to-random-string
LOG_LEVEL=info
```

**重要**：将 `your_mysql_password` 替换为您的 MySQL root 密码

### 4.2 验证连接
```bash
npm test
```

---

## 🚀 步骤 5：启动应用

### 开发模式（测试）
```bash
npm run dev
```

### 生产模式（推荐）
```bash
npm start
```

访问 `http://localhost:3000` 进行测试

---

## 🔐 步骤 6：首次登录

| 用户名 | 密码 | 用途 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| staff | staff123 | 普通员工 |

**重要**：首次登录后立即修改密码！

---

## 📋 步骤 7：配置 Windows 服务（可选）

### 使用 PM2（推荐）

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "dhl-retour"

# 配置开机启动
pm2 startup
pm2 save

# 查看状态
pm2 status
```

---

## ✅ 验证清单

启动后，检查以下内容：

- [ ] 应用在 `http://localhost:3000` 可访问
- [ ] 登录页面正常显示
- [ ] 能使用 admin/admin123 登录
- [ ] 仪表板加载成功
- [ ] 可以访问各个功能页面

---

## 🌐 功能访问地址

| 功能 | URL |
|------|-----|
| 登录 | http://localhost:3000/login |
| 仪表板 | http://localhost:3000/dashboard |
| 客户管理 | http://localhost:3000/customers |
| 回邮单 | http://localhost:3000/shipments |
| 轨迹追踪 | http://localhost:3000/tracking |
| 结算管理 | http://localhost:3000/settlement |
| 报价管理 | http://localhost:3000/quotations |
| 统计汇总 | http://localhost:3000/summary |

---

## 🆘 常见问题

### 问题：npm install 失败

```bash
# 清除缓存
npm cache clean --force

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 问题：MySQL 连接失败

1. 检查 MySQL 是否运行：
   ```bash
   tasklist | findstr mysql
   ```

2. 检查 `.env` 中的数据库配置

3. 测试连接：
   ```bash
   mysql -u root -p -h localhost
   ```

### 问题：端口 3000 被占用

```bash
# 查看占用 3000 的进程
netstat -ano | findstr :3000

# 杀死进程（替换 PID）
taskkill /PID <PID> /F
```

---

## 📚 详细文档

完整的部署指南请参考：`DEPLOYMENT_GUIDE_CN.md`

---

## 🎯 下一步

1. **配置 Nginx 反向代理**（可选）
2. **配置 SSL/HTTPS**（生产环境推荐）
3. **设置定期备份**
4. **配置监控告警**

---

## 📞 技术支持

遇到问题？请检查：

1. 日志文件：`pm2 logs dhl-retour`
2. 事件查看器：`Win + R` → `eventvwr.msc`
3. 完整部署指南：`DEPLOYMENT_GUIDE_CN.md`

---

**祝您部署顺利！** 🚀
