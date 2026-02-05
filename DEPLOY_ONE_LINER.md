# DHL 回邮单系统 - 一行部署命令

## 🚀 快速部署

如果您的 Windows 服务器上已安装 Git，可以直接复制以下命令到 PowerShell 中运行：

### 方法 1：使用 Git 克隆（推荐）

```powershell
cd C:\othello && git clone https://github.com/jackiechen33110/dhl.git DHL && cd DHL && npm install
```

然后按照以下步骤完成部署：

```powershell
# 1. 编辑 .env 文件（设置 MySQL 密码）
notepad .env

# 2. 初始化数据库
mysql -u root -p < sql/init.sql

# 3. 启动应用
npm start
```

### 方法 2：使用完整的部署脚本

如果您的服务器上已有项目文件，可以运行以下命令下载并执行部署脚本：

```powershell
$url = "https://raw.githubusercontent.com/jackiechen33110/dhl/main/deploy/deploy.ps1"
$output = "$env:TEMP\deploy.ps1"
Invoke-WebRequest -Uri $url -OutFile $output
powershell -ExecutionPolicy Bypass -File $output
```

---

## 📋 完整的部署步骤

### 步骤 1：打开 PowerShell（管理员）

- 按 `Win + X`
- 选择 "Windows PowerShell (管理员)"
- 或搜索 "PowerShell"，右键选择"以管理员身份运行"

### 步骤 2：导航到目标目录

```powershell
cd C:\othello
```

### 步骤 3：克隆代码

```powershell
git clone https://github.com/jackiechen33110/dhl.git DHL
cd DHL
```

### 步骤 4：安装依赖

```powershell
npm install
```

这可能需要 2-5 分钟。

### 步骤 5：创建 .env 文件

```powershell
# 使用记事本编辑
notepad .env
```

在打开的记事本中，输入以下内容并保存：

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

**重要**：将 `your_mysql_password` 替换为您的 MySQL 密码。

### 步骤 6：初始化数据库

```powershell
mysql -u root -p < sql/init.sql
```

输入您的 MySQL 密码。

### 步骤 7：启动应用

```powershell
npm start
```

您应该看到类似的输出：

```
DHL 回邮单系统运行在 http://localhost:3000
```

### 步骤 8：访问系统

打开浏览器，访问：

```
http://localhost:3000
```

### 步骤 9：登录

使用默认账户登录：
- **用户名**：admin
- **密码**：admin123

---

## 🆘 常见问题

### Q: Git 未安装

**A**: 访问 https://git-scm.com/ 下载并安装 Git。

### Q: Node.js 未安装

**A**: 访问 https://nodejs.org/ 下载并安装 Node.js 14+。

### Q: MySQL 未安装

**A**: 访问 https://dev.mysql.com/downloads/mysql/ 下载并安装 MySQL 5.7+。

### Q: npm install 失败

**A**: 清除缓存并重试：

```powershell
npm cache clean --force
npm install
```

### Q: MySQL 连接失败

**A**: 检查 MySQL 是否运行：

```powershell
# 检查 MySQL 服务
Get-Service MySQL80  # 或其他版本号

# 如果未运行，启动服务
Start-Service MySQL80
```

### Q: 端口 3000 被占用

**A**: 修改 `.env` 中的 PORT 值：

```env
PORT=3001
```

然后访问 `http://localhost:3001`

---

## 📊 部署完成后

部署成功后，您应该能够：

✅ 访问系统：http://localhost:3000  
✅ 使用默认账户登录  
✅ 查看所有功能页面  
✅ 执行各项操作  

---

## 🔧 配置 Windows 服务（可选）

如果您想让应用在开机时自动启动，可以使用 PM2：

### 1. 全局安装 PM2

```powershell
npm install -g pm2
```

### 2. 启动应用

```powershell
cd C:\othello\DHL
pm2 start server.js --name "dhl-retour"
```

### 3. 配置开机启动

```powershell
pm2 startup
pm2 save
```

### 4. 查看应用状态

```powershell
pm2 status
pm2 logs dhl-retour
```

---

## 📚 更多文档

- `QUICK_START.md` - 快速开始指南
- `DEPLOYMENT_GUIDE_CN.md` - 完整部署指南
- `PAGE_STRUCTURE.md` - 页面结构说明
- `deploy/README.md` - 部署脚本说明

---

## 💡 提示

- 所有命令都应在 PowerShell 中运行
- 确保使用管理员权限
- 如果遇到权限问题，可以使用 `-ExecutionPolicy Bypass`
- 部署过程中不要关闭 PowerShell 窗口

---

**现在就开始部署吧！** 🚀
