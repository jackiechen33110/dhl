# DHL 回邮单系统 - 文件同步指南

## 🚀 快速同步文件到 C:\othello\DHL

### 方法 1：使用 Git 克隆（推荐）

在 PowerShell 中运行以下命令：

```powershell
cd C:\othello
git clone https://github.com/jackiechen33110/dhl.git DHL
```

**完成！** 所有文件已同步到 `C:\othello\DHL`

---

### 方法 2：如果文件夹已存在，更新文件

```powershell
cd C:\othello\DHL
git pull origin main
```

---

### 方法 3：完整的同步脚本

如果您需要更多控制，可以使用以下脚本：

```powershell
# 设置目标路径
$targetPath = "C:\othello\DHL"
$gitUrl = "https://github.com/jackiechen33110/dhl.git"

# 检查目录是否存在
if (Test-Path $targetPath) {
    Write-Host "目录已存在，更新文件..."
    cd $targetPath
    git pull origin main
} else {
    Write-Host "创建目录并克隆文件..."
    cd C:\othello
    git clone $gitUrl DHL
}

Write-Host "✓ 文件同步完成！"
Write-Host "文件位置: $targetPath"
```

---

## 📁 同步后的文件结构

同步完成后，您的 `C:\othello\DHL` 文件夹中应该包含：

```
DHL/
├── deploy/                    # 部署脚本
├── public/                    # 静态文件
│   └── css/
├── routes/                    # 后端路由
├── sql/                       # 数据库脚本
├── views/                     # 前端模板
├── .github/                   # GitHub Actions
├── .gitignore
├── .env.example
├── server.js                  # 主服务器文件
├── db.js                      # 数据库连接
├── package.json               # 项目配置
├── package-lock.json
├── README.md
├── QUICK_START.md
├── DEPLOYMENT_GUIDE_CN.md
├── PAGE_STRUCTURE.md
├── DEPLOY_ONE_LINER.md
├── GITHUB_DEPLOY_GUIDE.md
└── DEPLOYMENT.md
```

---

## ✅ 验证同步

同步完成后，检查以下文件是否存在：

```powershell
# 检查主文件
Test-Path "C:\othello\DHL\server.js"
Test-Path "C:\othello\DHL\package.json"
Test-Path "C:\othello\DHL\sql\init.sql"

# 如果都返回 True，说明同步成功
```

---

## 🔄 定期更新

如果您想定期更新文件，可以运行：

```powershell
cd C:\othello\DHL
git pull origin main
```

---

## 💡 提示

- 确保已安装 Git
- 使用管理员权限运行 PowerShell
- 如果遇到权限问题，可以使用 `-ExecutionPolicy Bypass`

---

**文件同步完成后，您可以继续进行安装依赖、配置数据库等操作。**
