# DHL 回邮单系统 - Windows 自动部署脚本
# 使用方法: powershell -ExecutionPolicy Bypass -File deploy-windows.ps1

param(
    [string]$ProjectPath = "C:\dhl-retour-system",
    [string]$GitRepo = "git@github.com:jackiechen33110/dhl.git"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DHL 回邮单系统 - Windows 自动部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查项目目录
if (Test-Path $ProjectPath) {
    Write-Host "✓ 项目目录已存在: $ProjectPath" -ForegroundColor Green
} else {
    Write-Host "✗ 项目目录不存在，正在创建..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
}

# 进入项目目录
Set-Location $ProjectPath

# 检查 Git 是否已初始化
if (Test-Path ".git") {
    Write-Host "✓ Git 仓库已初始化" -ForegroundColor Green
    Write-Host "正在拉取最新代码..." -ForegroundColor Cyan
    git pull origin main
} else {
    Write-Host "✗ Git 仓库未初始化，正在克隆..." -ForegroundColor Yellow
    git clone $GitRepo .
}

# 检查 Node.js
Write-Host ""
Write-Host "检查 Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
if ($nodeVersion) {
    Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js 未安装，请先安装 Node.js 14+" -ForegroundColor Red
    exit 1
}

# 检查 npm
$npmVersion = npm --version
Write-Host "✓ npm 已安装: $npmVersion" -ForegroundColor Green

# 安装依赖
Write-Host ""
Write-Host "正在安装依赖..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 依赖安装完成" -ForegroundColor Green

# 检查 MySQL
Write-Host ""
Write-Host "检查 MySQL..." -ForegroundColor Cyan
$mysqlVersion = mysql --version 2>$null
if ($mysqlVersion) {
    Write-Host "✓ MySQL 已安装: $mysqlVersion" -ForegroundColor Green
} else {
    Write-Host "⚠ MySQL 未安装或未添加到 PATH，请手动初始化数据库" -ForegroundColor Yellow
}

# 检查 .env 文件
Write-Host ""
Write-Host "检查环境配置..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "✓ .env 文件已存在" -ForegroundColor Green
} else {
    Write-Host "⚠ .env 文件不存在，正在创建默认配置..." -ForegroundColor Yellow
    @"
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=dhl_retour
DB_PORT=3306

# Session 配置
SESSION_SECRET=change-this-secret-key-in-production
"@ | Out-File -Encoding UTF8 ".env"
    Write-Host "✓ .env 文件已创建，请修改数据库密码" -ForegroundColor Yellow
}

# 检查 PM2
Write-Host ""
Write-Host "检查 PM2..." -ForegroundColor Cyan
$pm2Version = pm2 --version 2>$null
if ($pm2Version) {
    Write-Host "✓ PM2 已安装: $pm2Version" -ForegroundColor Green
    
    # 停止旧的进程
    Write-Host "正在停止旧的进程..." -ForegroundColor Cyan
    pm2 stop dhl-retour 2>$null
    pm2 delete dhl-retour 2>$null
    
    # 启动新的进程
    Write-Host "正在启动应用..." -ForegroundColor Cyan
    pm2 start server.js --name dhl-retour --env production
    pm2 save
    
    Write-Host "✓ 应用已启动" -ForegroundColor Green
    pm2 status
} else {
    Write-Host "⚠ PM2 未安装，正在安装..." -ForegroundColor Yellow
    npm install -g pm2
    
    Write-Host "正在启动应用..." -ForegroundColor Cyan
    pm2 start server.js --name dhl-retour --env production
    pm2 save
    
    Write-Host "✓ 应用已启动" -ForegroundColor Green
}

# 显示部署完成信息
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ 部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "应用信息:" -ForegroundColor Cyan
Write-Host "  - 项目路径: $ProjectPath" -ForegroundColor White
Write-Host "  - 访问地址: http://localhost:3000" -ForegroundColor White
Write-Host "  - 默认账户: admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Cyan
Write-Host "  - 查看状态: pm2 status" -ForegroundColor White
Write-Host "  - 查看日志: pm2 logs dhl-retour" -ForegroundColor White
Write-Host "  - 重启应用: pm2 restart dhl-retour" -ForegroundColor White
Write-Host "  - 停止应用: pm2 stop dhl-retour" -ForegroundColor White
Write-Host ""
