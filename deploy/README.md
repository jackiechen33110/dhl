# DHL 回邮单系统 - 部署脚本使用指南

## 📋 概述

本目录包含自动部署脚本，可以在 Windows 服务器上一键部署 DHL 回邮单系统。

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `deploy.ps1` | Windows PowerShell 自动部署脚本 |
| `deploy-windows.ps1` | Windows 手动部署脚本（备选） |
| `deploy-linux.sh` | Linux/Mac 部署脚本 |

## 🚀 快速开始

### 在 Windows 服务器上部署

#### 步骤 1：打开 PowerShell

1. 按 `Win + X`
2. 选择 "Windows PowerShell (管理员)" 或 "终端 (管理员)"
3. 如果提示 UAC，点击"是"

#### 步骤 2：运行部署脚本

复制并粘贴以下命令：

```powershell
powershell -ExecutionPolicy Bypass -File "C:\othello\DHL\deploy\deploy.ps1"
```

或者，如果您已经在项目目录中：

```powershell
cd C:\othello\DHL
powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1
```

#### 步骤 3：按照提示操作

脚本会自动：
1. ✅ 检查 Node.js、npm、Git、MySQL 是否已安装
2. ✅ 创建项目目录
3. ✅ 克隆代码仓库
4. ✅ 安装 npm 依赖
5. ✅ 创建 .env 配置文件
6. ✅ 初始化数据库（可选）
7. ✅ 测试应用启动（可选）
8. ✅ 配置 PM2 Windows 服务（可选）

## ⚙️ 前置要求

在运行部署脚本前，请确保已安装：

### 1. Node.js 14+

```bash
# 检查版本
node --version
```

如未安装，访问：https://nodejs.org/

### 2. MySQL 5.7+

```bash
# 检查版本
mysql --version
```

如未安装，访问：https://dev.mysql.com/downloads/mysql/

### 3. Git

```bash
# 检查版本
git --version
```

如未安装，访问：https://git-scm.com/

## 📝 脚本功能详解

### 第 1 步：检查前置条件

脚本会检查以下工具是否已安装：
- ✓ Node.js
- ✓ npm
- ✓ Git
- ✓ MySQL（可选）

如有缺失，脚本会提示您安装。

### 第 2 步：创建项目目录

在 `C:\othello\DHL` 创建项目目录。

如果目录已存在，脚本会询问是否覆盖。

### 第 3 步：克隆代码仓库

从 GitHub 克隆最新代码：
```
https://github.com/jackiechen33110/dhl.git
```

### 第 4 步：安装依赖

运行 `npm install` 安装所有依赖包。

**预计时间**：2-5 分钟（取决于网络速度）

### 第 5 步：配置环境变量

创建 `.env` 文件，包含：
- 数据库连接信息
- 服务器端口
- Session 密钥

**重要**：您需要编辑 `.env` 文件并设置正确的 MySQL 密码。

### 第 6 步：初始化数据库

脚本会询问是否执行数据库初始化。

如果选择"是"，会运行 `sql/init.sql` 创建所有表和初始数据。

### 第 7 步：测试应用

脚本会启动应用 10 秒进行测试，然后自动停止。

### 第 8 步：配置 Windows 服务

脚本会询问是否安装 PM2 并配置为 Windows 服务。

如果选择"是"，应用会在开机时自动启动。

## 🔧 手动配置

如果脚本执行失败，您可以手动执行以下步骤：

### 1. 克隆代码

```bash
cd C:\othello
git clone https://github.com/jackiechen33110/dhl.git
cd DHL
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境

创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dhl_retour
DB_CHARSET=utf8mb4
SESSION_SECRET=your-secret-key
LOG_LEVEL=info
```

### 4. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 5. 启动应用

```bash
npm start
```

## 🆘 常见问题

### Q: 脚本执行权限被拒绝

**A**: 使用管理员权限运行 PowerShell：
```powershell
powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1
```

### Q: npm install 失败

**A**: 清除缓存并重试：
```bash
npm cache clean --force
npm install
```

### Q: MySQL 连接失败

**A**: 检查 MySQL 是否运行，以及 `.env` 中的密码是否正确。

### Q: 端口 3000 被占用

**A**: 修改 `.env` 中的 PORT 值为其他端口。

### Q: 脚本中途停止

**A**: 检查错误信息，解决问题后重新运行脚本。

## 📊 脚本输出示例

```
[2026-02-05 10:30:00] [Info] ========================================
[2026-02-05 10:30:00] [Info] DHL 回邮单系统 - Windows 自动部署
[2026-02-05 10:30:00] [Info] ========================================
[2026-02-05 10:30:00] [Info] 
[2026-02-05 10:30:00] [Info] 第 1 步：检查前置条件...
[2026-02-05 10:30:01] [Success] ✓ Node.js 已安装: v18.17.0
[2026-02-05 10:30:01] [Success] ✓ npm 已安装: 9.6.7
[2026-02-05 10:30:01] [Success] ✓ Git 已安装: git version 2.40.0
[2026-02-05 10:30:01] [Success] ✓ MySQL 已安装: mysql  Ver 8.0.32
...
```

## ✅ 部署成功标志

部署完成后，您应该看到：

```
✓ DHL 回邮单系统部署完成！
```

以及以下信息：
- 项目位置：`C:\othello\DHL`
- 应用地址：`http://localhost:3000`
- 默认账户：admin / admin123

## 🎯 部署后的步骤

1. **编辑 .env 文件**
   ```
   C:\othello\DHL\.env
   ```
   设置正确的 MySQL 密码

2. **初始化数据库**（如果脚本跳过了）
   ```bash
   mysql -u root -p < C:\othello\DHL\sql\init.sql
   ```

3. **启动应用**
   ```bash
   cd C:\othello\DHL
   npm start
   ```

4. **访问系统**
   ```
   http://localhost:3000
   ```

5. **登录**
   - 用户名：admin
   - 密码：admin123

## 📚 相关文档

- `QUICK_START.md` - 快速开始指南
- `DEPLOYMENT_GUIDE_CN.md` - 完整部署指南
- `PAGE_STRUCTURE.md` - 页面结构说明

## 💡 提示

- 脚本会询问多个问题，请根据实际情况回答
- 如果不确定，可以选择默认选项
- 脚本是幂等的，可以安全地重复运行
- 所有日志都会显示在控制台中

## 🔐 安全建议

1. **修改默认密码**
   - 部署后立即修改 admin 账户的密码

2. **设置 SESSION_SECRET**
   - 在 `.env` 中设置一个强随机密钥

3. **配置 HTTPS**
   - 在生产环境中使用 SSL/TLS 证书

4. **定期备份**
   - 定期备份数据库和应用文件

## 📞 技术支持

如遇到问题，请：

1. 检查错误日志
2. 参考相关文档
3. 查看常见问题部分
4. 联系技术支持

---

**脚本版本**：1.0.0  
**最后更新**：2026 年 2 月 5 日
