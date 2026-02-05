# DHL 回邮单系统 - Windows 服务器部署指南

## 📋 目录
1. [系统要求](#系统要求)
2. [环境准备](#环境准备)
3. [安装步骤](#安装步骤)
4. [数据库配置](#数据库配置)
5. [应用启动](#应用启动)
6. [Windows 服务配置](#windows-服务配置)
7. [Nginx 反向代理](#nginx-反向代理)
8. [故障排查](#故障排查)
9. [维护和更新](#维护和更新)

---

## 系统要求

### 硬件要求
- **CPU**：2核心及以上
- **内存**：4GB 及以上
- **硬盘**：20GB 可用空间
- **网络**：稳定的互联网连接

### 软件要求
- **操作系统**：Windows Server 2016 或更高版本
- **Node.js**：14.0 或更高版本
- **MySQL**：5.7 或更高版本（推荐 8.0）
- **Git**：用于代码管理（可选）

---

## 环境准备

### 1. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 运行安装程序，选择默认选项
4. 验证安装：
   ```bash
   node --version
   npm --version
   ```

### 2. 安装 MySQL

1. 访问 [MySQL 官网](https://dev.mysql.com/downloads/mysql/)
2. 下载 MySQL Community Server
3. 运行安装程序
4. 选择"Developer Default"安装类型
5. 配置 MySQL 服务器：
   - 端口：3306（默认）
   - 字符集：utf8mb4
   - 创建 MySQL 用户（建议用户名：root）
6. 验证安装：
   ```bash
   mysql --version
   ```

### 3. 安装 Git（可选）

1. 访问 [Git 官网](https://git-scm.com/)
2. 下载 Windows 版本
3. 运行安装程序，选择默认选项
4. 验证安装：
   ```bash
   git --version
   ```

---

## 安装步骤

### 方式 A：使用 Git 克隆（推荐）

1. **打开命令行**（Win + R，输入 `cmd`）

2. **导航到项目目录**
   ```bash
   cd C:\
   ```

3. **克隆仓库**
   ```bash
   git clone https://github.com/jackiechen33110/dhl.git
   cd dhl
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

### 方式 B：手动下载

1. 访问 [GitHub 仓库](https://github.com/jackiechen33110/dhl)
2. 点击 "Code" → "Download ZIP"
3. 解压到 `C:\dhl-retour-system`
4. 打开命令行，导航到项目目录
5. 运行 `npm install`

---

## 数据库配置

### 1. 创建数据库

1. **打开 MySQL 命令行**
   ```bash
   mysql -u root -p
   ```
   输入 MySQL root 密码

2. **执行初始化脚本**
   ```bash
   source C:\dhl-retour-system\sql\init.sql;
   ```
   
   或者使用以下命令：
   ```bash
   mysql -u root -p < C:\dhl-retour-system\sql\init.sql
   ```

3. **验证数据库创建**
   ```sql
   SHOW DATABASES;
   USE dhl_retour;
   SHOW TABLES;
   ```

### 2. 配置环境变量

1. **创建 `.env` 文件**
   
   在项目根目录创建文件 `.env`，内容如下：
   
   ```env
   # 服务器配置
   PORT=3000
   NODE_ENV=production

   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=dhl_retour
   DB_CHARSET=utf8mb4

   # Session 配置
   SESSION_SECRET=your-secret-key-change-this

   # 日志配置
   LOG_LEVEL=info
   ```

   **重要**：将 `your_mysql_password` 替换为您的 MySQL root 密码

2. **验证连接**
   ```bash
   npm test
   ```

---

## 应用启动

### 1. 开发模式（测试）

```bash
npm run dev
```

访问 `http://localhost:3000` 进行测试

### 2. 生产模式

```bash
npm start
```

---

## Windows 服务配置

### 方式 A：使用 PM2（推荐）

PM2 是 Node.js 进程管理器，可以自动重启应用和开机启动。

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 启动应用

```bash
cd C:\dhl-retour-system
pm2 start server.js --name "dhl-retour"
```

#### 3. 配置开机启动

```bash
pm2 startup
pm2 save
```

#### 4. 常用命令

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs dhl-retour

# 重启应用
pm2 restart dhl-retour

# 停止应用
pm2 stop dhl-retour

# 删除应用
pm2 delete dhl-retour
```

### 方式 B：使用 NSSM（Windows 原生方式）

NSSM 可以将 Node.js 应用注册为 Windows 服务。

#### 1. 下载 NSSM

访问 [NSSM 官网](https://nssm.cc/download)，下载 Windows 版本

#### 2. 解压并配置

```bash
# 解压到 C:\nssm
cd C:\nssm\win64
```

#### 3. 注册服务

```bash
nssm install DHL-Retour "C:\Program Files\nodejs\node.exe" "C:\dhl-retour-system\server.js"
```

#### 4. 启动服务

```bash
nssm start DHL-Retour
```

#### 5. 常用命令

```bash
# 查看服务状态
nssm status DHL-Retour

# 停止服务
nssm stop DHL-Retour

# 编辑服务配置
nssm edit DHL-Retour

# 删除服务
nssm remove DHL-Retour confirm
```

---

## Nginx 反向代理

### 1. 安装 Nginx

1. 访问 [Nginx 官网](http://nginx.org/en/download.html)
2. 下载 Windows 版本
3. 解压到 `C:\nginx`

### 2. 配置 Nginx

编辑 `C:\nginx\conf\nginx.conf`，修改 `server` 块：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改为您的域名或 IP

    # 重定向 HTTP 到 HTTPS（可选）
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
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
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 启动 Nginx

```bash
cd C:\nginx
start nginx
```

### 4. 常用命令

```bash
# 重新加载配置
nginx -s reload

# 停止 Nginx
nginx -s stop

# 查看 Nginx 进程
tasklist | findstr nginx
```

### 5. 配置 SSL/TLS（HTTPS）

1. 获取 SSL 证书（推荐使用 Let's Encrypt 或购买）
2. 修改 Nginx 配置：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        # ... 其他配置同上
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 故障排查

### 问题 1：端口 3000 被占用

**症状**：启动应用时报错 `Port 3000 already in use`

**解决方案**：
```bash
# 查看占用 3000 端口的进程
netstat -ano | findstr :3000

# 杀死进程（PID 为上面查到的进程 ID）
taskkill /PID <PID> /F

# 或修改 .env 中的 PORT 为其他端口
```

### 问题 2：MySQL 连接失败

**症状**：应用启动失败，提示数据库连接错误

**解决方案**：
1. 检查 MySQL 是否运行：
   ```bash
   tasklist | findstr mysql
   ```
2. 检查 `.env` 中的数据库配置是否正确
3. 尝试手动连接：
   ```bash
   mysql -u root -p -h localhost
   ```

### 问题 3：npm install 失败

**症状**：安装依赖时报错

**解决方案**：
```bash
# 清除 npm 缓存
npm cache clean --force

# 重新安装
npm install

# 如果仍然失败，尝试使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题 4：应用崩溃

**症状**：应用无故停止运行

**解决方案**：
```bash
# 查看日志
pm2 logs dhl-retour

# 或查看 Windows 事件查看器
# Win + R → eventvwr.msc
```

---

## 维护和更新

### 1. 定期备份

```bash
# 备份数据库
mysqldump -u root -p dhl_retour > backup_dhl_retour_$(date +%Y%m%d).sql

# 备份应用文件
xcopy C:\dhl-retour-system C:\dhl-retour-system-backup /E /I
```

### 2. 更新代码

```bash
cd C:\dhl-retour-system

# 拉取最新代码
git pull origin main

# 安装新依赖（如果有）
npm install

# 重启应用
pm2 restart dhl-retour
```

### 3. 查看日志

```bash
# PM2 日志
pm2 logs dhl-retour

# 应用日志目录
C:\dhl-retour-system\logs\
```

### 4. 监控应用

```bash
# 查看应用状态
pm2 status

# 查看系统资源使用
pm2 monit
```

---

## 默认登录凭证

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| staff | staff123 | 员工 |

**重要**：部署后请立即修改默认密码！

---

## 系统功能概览

### 核心功能
- ✅ 用户认证与权限管理
- ✅ 客户信息管理
- ✅ 回邮单批量导入
- ✅ 回邮单列表与详情
- ✅ CN23 报关单管理
- ✅ 轨迹追踪
- ✅ 结算管理
- ✅ 报价管理
- ✅ 统计汇总
- ✅ 操作日志

### 访问地址

| 功能 | URL |
|------|-----|
| 登录 | `http://your-server:3000/login` |
| 仪表板 | `http://your-server:3000/dashboard` |
| 客户管理 | `http://your-server:3000/customers` |
| 回邮单 | `http://your-server:3000/shipments` |
| 轨迹追踪 | `http://your-server:3000/tracking` |
| 结算管理 | `http://your-server:3000/settlement` |
| 报价管理 | `http://your-server:3000/quotations` |
| 统计汇总 | `http://your-server:3000/summary` |

---

## 技术支持

如遇到问题，请检查以下内容：

1. **Node.js 和 npm 版本**
   ```bash
   node --version
   npm --version
   ```

2. **MySQL 连接**
   ```bash
   mysql -u root -p -e "SELECT VERSION();"
   ```

3. **应用日志**
   ```bash
   pm2 logs dhl-retour
   ```

4. **系统事件日志**
   - Win + R → `eventvwr.msc`

---

## 常见问题 (FAQ)

**Q: 如何修改应用监听的端口？**
A: 修改 `.env` 文件中的 `PORT` 值，然后重启应用。

**Q: 如何备份数据库？**
A: 使用 `mysqldump` 命令或 MySQL Workbench 进行备份。

**Q: 如何扩展功能？**
A: 修改源代码后，运行 `npm install`（如有新依赖），然后重启应用。

**Q: 如何配置 HTTPS？**
A: 获取 SSL 证书，在 Nginx 中配置 SSL 参数。

---

## 更新日志

### 版本 1.0.0（当前版本）
- ✅ 基础功能完成
- ✅ 轨迹追踪功能
- ✅ 结算管理功能
- ✅ 报价管理功能

---

**最后更新**：2026 年 2 月 5 日

**文档版本**：1.0.0

---

## 许可证

本项目采用 MIT 许可证。

---

**祝您部署顺利！如有问题，请联系技术支持。** 🚀
