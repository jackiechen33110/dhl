# DHL 回邮单系统 - 部署指南

本文档提供了在 Windows 服务器上部署 DHL 回邮单系统的详细步骤。

## 系统要求

- **操作系统**: Windows Server 2016 或更高版本
- **Node.js**: 14.0 或更高版本
- **MySQL**: 5.7 或更高版本
- **内存**: 最少 2GB
- **磁盘**: 最少 10GB

## 部署步骤

### 1. 安装依赖软件

#### 1.1 安装 Node.js

1. 访问 [Node.js 官方网站](https://nodejs.org/)
2. 下载 LTS 版本
3. 运行安装程序，按照向导完成安装
4. 验证安装：打开 PowerShell 或 CMD，输入：
   ```bash
   node --version
   npm --version
   ```

#### 1.2 安装 MySQL

1. 访问 [MySQL 官方网站](https://dev.mysql.com/downloads/mysql/)
2. 下载 MySQL Server 5.7 或 8.0
3. 运行安装程序，选择"Developer Default"配置
4. 配置 MySQL 服务：
   - 设置端口为 3306（默认）
   - 设置 root 密码
   - 配置为 Windows 服务

### 2. 准备项目

#### 2.1 上传项目文件

1. 将项目文件上传到服务器，例如：`C:\dhl-retour-system\`
2. 确保所有文件都已正确上传

#### 2.2 安装项目依赖

打开 PowerShell，进入项目目录：

```bash
cd C:\dhl-retour-system
npm install
```

### 3. 配置数据库

#### 3.1 创建数据库

打开 MySQL 命令行或 MySQL Workbench，执行初始化脚本：

```bash
mysql -u root -p < sql/init.sql
```

或在 MySQL Workbench 中：
1. 打开 `sql/init.sql` 文件
2. 点击"执行"按钮

#### 3.2 验证数据库

```bash
mysql -u root -p
USE dhl_retour;
SHOW TABLES;
```

应该看到以下表：
- users
- customers
- shipments
- shipment_items
- country_rules
- cn23_product_library
- cn23_forms
- operation_logs

### 4. 配置环境变量

#### 4.1 创建 .env 文件

在项目根目录创建 `.env` 文件，内容如下：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dhl_retour
DB_PORT=3306

# Session 配置
SESSION_SECRET=your-secret-key-change-this-in-production

# 日志配置
LOG_LEVEL=info
```

**重要**: 修改以下值：
- `DB_PASSWORD`: 您的 MySQL root 密码
- `SESSION_SECRET`: 生成一个强密钥（例如：`openssl rand -base64 32`）

### 5. 启动应用

#### 5.1 测试运行

```bash
cd C:\dhl-retour-system
npm start
```

应该看到输出：
```
DHL 回邮单系统运行在 http://localhost:3000
```

#### 5.2 访问应用

打开浏览器，访问：`http://localhost:3000`

使用默认账户登录：
- **用户名**: admin
- **密码**: admin123

### 6. 配置为 Windows 服务（可选）

使用 PM2 或 NSSM 将应用配置为 Windows 服务。

#### 使用 PM2（推荐）

1. 全局安装 PM2：
   ```bash
   npm install -g pm2
   ```

2. 启动应用：
   ```bash
   cd C:\dhl-retour-system
   pm2 start server.js --name "dhl-retour"
   ```

3. 配置开机自启：
   ```bash
   pm2 startup windows
   pm2 save
   ```

4. 查看应用状态：
   ```bash
   pm2 status
   pm2 logs dhl-retour
   ```

#### 使用 NSSM

1. 下载 [NSSM](https://nssm.cc/download)
2. 解压到 `C:\nssm\`
3. 打开 CMD，进入 NSSM 目录：
   ```bash
   cd C:\nssm\win64
   nssm install dhl-retour "C:\Program Files\nodejs\node.exe" "C:\dhl-retour-system\server.js"
   nssm start dhl-retour
   ```

### 7. 配置反向代理（可选）

#### 使用 Nginx

1. 下载并安装 [Nginx](http://nginx.org/en/download.html)
2. 编辑 `conf/nginx.conf`：

```nginx
upstream dhl_retour {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://dhl_retour;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. 启动 Nginx：
   ```bash
   nginx.exe
   ```

### 8. 配置 SSL/TLS（可选）

使用 Let's Encrypt 获取免费 SSL 证书：

1. 安装 Certbot
2. 获取证书：
   ```bash
   certbot certonly --standalone -d yourdomain.com
   ```
3. 在 Nginx 配置中添加 SSL：

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 维护和管理

### 日志管理

应用日志位置：
- **应用日志**: 控制台输出（如使用 PM2，查看 `pm2 logs`）
- **数据库日志**: MySQL 日志目录

### 数据备份

定期备份数据库：

```bash
mysqldump -u root -p dhl_retour > backup_dhl_retour_$(date +%Y%m%d).sql
```

或使用 Windows 任务计划程序创建自动备份任务。

### 更新应用

1. 停止应用：
   ```bash
   pm2 stop dhl-retour
   ```

2. 更新代码：
   ```bash
   git pull origin main
   npm install
   ```

3. 重启应用：
   ```bash
   pm2 restart dhl-retour
   ```

### 监控应用

使用 PM2 监控：

```bash
pm2 monit
```

## 常见问题

### Q: 应用无法连接到数据库

**A**: 检查以下几点：
1. MySQL 服务是否正在运行
2. `.env` 文件中的数据库凭证是否正确
3. 防火墙是否允许 3306 端口

### Q: 端口 3000 已被占用

**A**: 修改 `.env` 文件中的 `PORT` 值，或关闭占用该端口的应用。

### Q: 如何修改管理员密码

**A**: 在 MySQL 中执行：
```sql
UPDATE users SET password_hash = 'new_password' WHERE username = 'admin';
```

### Q: 如何添加新用户

**A**: 在 MySQL 中执行：
```sql
INSERT INTO users (username, password_hash, full_name, email, role) 
VALUES ('username', 'password', 'Full Name', 'email@example.com', 'staff');
```

### Q: 应用崩溃了怎么办

**A**: 
1. 查看日志：`pm2 logs dhl-retour`
2. 重启应用：`pm2 restart dhl-retour`
3. 检查服务器资源（CPU、内存、磁盘）

## 性能优化

### 1. 启用 gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 2. 配置连接池

在 `db.js` 中调整连接池大小：
```javascript
const pool = mysql.createPool({
    connectionLimit: 10,
    // ...
});
```

### 3. 启用缓存

使用 Redis 缓存频繁访问的数据。

## 安全建议

1. **定期更新**: 保持 Node.js 和依赖包最新
2. **强密码**: 使用强密码保护数据库和管理员账户
3. **HTTPS**: 在生产环境中使用 SSL/TLS
4. **防火墙**: 限制对应用的访问
5. **备份**: 定期备份数据库
6. **监控**: 设置日志监控和告警

## 支持

如有问题，请查看 README.md 或联系开发团队。
