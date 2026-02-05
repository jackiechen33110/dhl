#!/bin/bash

# DHL 回邮单系统 - Linux/Mac 自动部署脚本
# 使用方法: bash deploy-linux.sh

set -e

PROJECT_PATH="${1:-.}"
GIT_REPO="git@github.com:jackiechen33110/dhl.git"

echo "========================================"
echo "DHL 回邮单系统 - Linux/Mac 自动部署"
echo "========================================"
echo ""

# 检查项目目录
if [ -d "$PROJECT_PATH" ]; then
    echo "✓ 项目目录已存在: $PROJECT_PATH"
else
    echo "✗ 项目目录不存在，正在创建..."
    mkdir -p "$PROJECT_PATH"
fi

# 进入项目目录
cd "$PROJECT_PATH"

# 检查 Git 是否已初始化
if [ -d ".git" ]; then
    echo "✓ Git 仓库已初始化"
    echo "正在拉取最新代码..."
    git pull origin main
else
    echo "✗ Git 仓库未初始化，正在克隆..."
    git clone "$GIT_REPO" .
fi

# 检查 Node.js
echo ""
echo "检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js 已安装: $NODE_VERSION"
else
    echo "✗ Node.js 未安装，请先安装 Node.js 14+"
    exit 1
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm 已安装: $NPM_VERSION"
else
    echo "✗ npm 未安装"
    exit 1
fi

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install
echo "✓ 依赖安装完成"

# 检查 MySQL
echo ""
echo "检查 MySQL..."
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    echo "✓ MySQL 已安装: $MYSQL_VERSION"
else
    echo "⚠ MySQL 未安装或未添加到 PATH，请手动初始化数据库"
fi

# 检查 .env 文件
echo ""
echo "检查环境配置..."
if [ -f ".env" ]; then
    echo "✓ .env 文件已存在"
else
    echo "⚠ .env 文件不存在，正在创建默认配置..."
    cat > .env << EOF
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
EOF
    echo "✓ .env 文件已创建，请修改数据库密码"
fi

# 检查 PM2
echo ""
echo "检查 PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "✓ PM2 已安装: $PM2_VERSION"
    
    # 停止旧的进程
    echo "正在停止旧的进程..."
    pm2 stop dhl-retour 2>/dev/null || true
    pm2 delete dhl-retour 2>/dev/null || true
    
    # 启动新的进程
    echo "正在启动应用..."
    pm2 start server.js --name dhl-retour --env production
    pm2 save
    
    echo "✓ 应用已启动"
    pm2 status
else
    echo "⚠ PM2 未安装，正在安装..."
    sudo npm install -g pm2
    
    echo "正在启动应用..."
    pm2 start server.js --name dhl-retour --env production
    pm2 save
    
    echo "✓ 应用已启动"
fi

# 显示部署完成信息
echo ""
echo "========================================"
echo "✓ 部署完成！"
echo "========================================"
echo ""
echo "应用信息:"
echo "  - 项目路径: $PROJECT_PATH"
echo "  - 访问地址: http://localhost:3000"
echo "  - 默认账户: admin / admin123"
echo ""
echo "常用命令:"
echo "  - 查看状态: pm2 status"
echo "  - 查看日志: pm2 logs dhl-retour"
echo "  - 重启应用: pm2 restart dhl-retour"
echo "  - 停止应用: pm2 stop dhl-retour"
echo ""
