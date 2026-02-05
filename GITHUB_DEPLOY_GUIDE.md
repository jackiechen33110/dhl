# GitHub 自动部署到服务器 - 完整指南

本指南说明如何配置 GitHub Actions，使得每次推送代码到 GitHub 时，自动部署到您的 Windows 服务器。

## 方案选择

### 方案 A：GitHub Actions + SSH 远程部署（推荐）
- **优点**：完全自动化，无需手动操作
- **缺点**：需要配置 SSH 密钥和 GitHub Secrets
- **适用**：有公网 IP 或 VPN 的服务器

### 方案 B：本地定时拉取更新
- **优点**：简单，无需暴露服务器
- **缺点**：需要定时任务，部署不够及时
- **适用**：内网服务器，无公网访问

### 方案 C：Webhook + 本地服务
- **优点**：实时部署，安全性高
- **缺点**：需要额外的 Webhook 处理服务
- **适用**：有一定技术基础的用户

---

## 方案 A：GitHub Actions 自动部署（推荐）

### 第 1 步：生成 SSH 密钥对

在 Windows 服务器上生成 SSH 密钥：

```powershell
# 打开 PowerShell，运行以下命令
ssh-keygen -t ed25519 -f C:\Users\YourUsername\.ssh\github_deploy -N ""
```

这会生成两个文件：
- `github_deploy` - 私钥（保密）
- `github_deploy.pub` - 公钥

### 第 2 步：配置服务器 SSH

1. 将公钥内容添加到服务器的 `authorized_keys`：

```powershell
# 在 Windows 上，如果已安装 OpenSSH Server
# 将公钥内容添加到：
C:\ProgramData\ssh\administrators_authorized_keys

# 或者在 Linux 上：
cat github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

2. 测试 SSH 连接：

```bash
ssh -i github_deploy -p 22 username@your-server-ip
```

### 第 3 步：配置 GitHub Secrets

1. 访问您的 GitHub 仓库：`https://github.com/jackiechen33110/dhl`
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `SERVER_HOST` | `your-server-ip` | 服务器 IP 地址或域名 |
| `SERVER_USER` | `username` | SSH 用户名（通常是 Administrator） |
| `SERVER_PORT` | `22` | SSH 端口（默认 22） |
| `SERVER_SSH_KEY` | 私钥内容 | 复制 `github_deploy` 文件的全部内容 |
| `DEPLOY_PATH` | `C:\dhl-retour-system` | 服务器上的项目路径 |

**获取私钥内容**：

```powershell
# Windows PowerShell
Get-Content C:\Users\YourUsername\.ssh\github_deploy -Raw | Set-Clipboard
```

```bash
# Linux/Mac
cat ~/.ssh/github_deploy | pbcopy  # Mac
cat ~/.ssh/github_deploy | xclip -selection clipboard  # Linux
```

### 第 4 步：验证工作流

1. 修改代码并推送到 GitHub：

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

2. 访问 GitHub 仓库的 **Actions** 标签页，查看部署状态
3. 如果部署成功，应该看到绿色的 ✓ 标记

---

## 方案 B：本地定时拉取更新

### 第 1 步：创建 PowerShell 脚本

在服务器上创建 `C:\scripts\deploy.ps1`：

```powershell
# 进入项目目录
cd C:\dhl-retour-system

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 重启应用
pm2 restart dhl-retour

# 记录日志
Add-Content -Path "C:\logs\deploy.log" -Value "$(Get-Date): Deployment completed"
```

### 第 2 步：配置 Windows 任务计划

1. 打开 **任务计划程序**（Task Scheduler）
2. 创建新任务：
   - **名称**：DHL Retour Deploy
   - **触发器**：每天 2:00 AM（或您选择的时间）
   - **操作**：运行 PowerShell 脚本

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\scripts\deploy.ps1
```

### 第 3 步：测试

手动运行任务，检查是否成功部署。

---

## 方案 C：Webhook + 本地服务

### 第 1 步：创建 Webhook 处理服务

创建 `C:\webhook-server\server.js`：

```javascript
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const SECRET = 'your-webhook-secret'; // 修改为您的密钥
const DEPLOY_SCRIPT = 'C:\\scripts\\deploy.ps1';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      // 验证签名
      const signature = req.headers['x-hub-signature-256'];
      const hash = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(body)
        .digest('hex');
      
      if (signature !== hash) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      // 执行部署脚本
      exec(`powershell.exe -ExecutionPolicy Bypass -File ${DEPLOY_SCRIPT}`, 
        (error, stdout, stderr) => {
          if (error) {
            console.error('Deployment error:', error);
            res.writeHead(500);
            res.end('Deployment failed');
            return;
          }
          
          console.log('Deployment successful');
          res.writeHead(200);
          res.end('Deployment completed');
        }
      );
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, () => {
  console.log('Webhook server listening on port 3001');
});
```

### 第 2 步：配置 GitHub Webhook

1. 访问仓库 **Settings** → **Webhooks**
2. 点击 **Add webhook**
3. 填写以下信息：
   - **Payload URL**: `http://your-server-ip:3001/webhook`
   - **Content type**: `application/json`
   - **Secret**: 输入您的密钥（与脚本中的 SECRET 相同）
   - **Events**: 选择 **Push events**

### 第 3 步：启动 Webhook 服务

```powershell
# 使用 PM2 启动
pm2 start C:\webhook-server\server.js --name webhook-server
pm2 save
```

---

## 故障排查

### 问题 1：GitHub Actions 显示连接失败

**解决方案**：
1. 检查 `SERVER_HOST` 是否正确
2. 确认 SSH 密钥是否正确复制
3. 验证防火墙是否允许 SSH 连接（端口 22）

### 问题 2：部署后应用未重启

**解决方案**：
1. 检查 PM2 是否正确安装
2. 验证 PM2 进程名称是否为 `dhl-retour`
3. 查看 PM2 日志：`pm2 logs dhl-retour`

### 问题 3：Webhook 无法触发

**解决方案**：
1. 检查 Webhook 服务器是否运行
2. 验证防火墙是否允许端口 3001
3. 查看 GitHub Webhook 的 Recent Deliveries 日志

---

## 安全建议

1. **不要在代码中存储密钥**
   - 使用 GitHub Secrets 存储敏感信息
   - 使用 `.env` 文件管理本地配置

2. **限制 SSH 访问**
   - 使用强密码或密钥认证
   - 配置防火墙限制 SSH 端口访问

3. **定期更新依赖**
   - 使用 `npm audit` 检查安全漏洞
   - 定期运行 `npm update`

4. **监控部署日志**
   - 查看 GitHub Actions 日志
   - 监控服务器应用日志

---

## 快速参考

### 查看部署状态
```bash
# GitHub Actions
访问 https://github.com/jackiechen33110/dhl/actions

# 服务器应用
pm2 status
pm2 logs dhl-retour
```

### 手动部署
```bash
cd C:\dhl-retour-system
git pull origin main
npm install
pm2 restart dhl-retour
```

### 回滚到上一个版本
```bash
cd C:\dhl-retour-system
git revert HEAD
git push origin main
# GitHub Actions 会自动部署
```

---

## 支持

如有问题，请查看：
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Node.js 部署指南](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
