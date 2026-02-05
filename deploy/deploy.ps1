# DHL 回邮单系统 - Windows 自动部署脚本
# 用途：在 Windows 服务器上自动部署 DHL 系统
# 使用方法：powershell -ExecutionPolicy Bypass -File deploy.ps1

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
$colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-Log {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = $colors[$Type]
    Write-Host "[$timestamp] [$Type] $Message" -ForegroundColor $color
}

function Test-Command {
    param([string]$Command)
    try {
        & $Command --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# ============================================
# 第 1 步：检查前置条件
# ============================================
Write-Log "========================================" "Info"
Write-Log "DHL 回邮单系统 - Windows 自动部署" "Info"
Write-Log "========================================" "Info"
Write-Log ""

Write-Log "第 1 步：检查前置条件..." "Info"

# 检查 Node.js
if (Test-Command "node") {
    $nodeVersion = & node --version
    Write-Log "✓ Node.js 已安装: $nodeVersion" "Success"
} else {
    Write-Log "✗ Node.js 未安装，请先安装 Node.js 14+" "Error"
    exit 1
}

# 检查 npm
if (Test-Command "npm") {
    $npmVersion = & npm --version
    Write-Log "✓ npm 已安装: $npmVersion" "Success"
} else {
    Write-Log "✗ npm 未安装" "Error"
    exit 1
}

# 检查 Git
if (Test-Command "git") {
    $gitVersion = & git --version
    Write-Log "✓ Git 已安装: $gitVersion" "Success"
} else {
    Write-Log "✗ Git 未安装，请先安装 Git" "Error"
    exit 1
}

# 检查 MySQL
if (Test-Command "mysql") {
    $mysqlVersion = & mysql --version
    Write-Log "✓ MySQL 已安装: $mysqlVersion" "Success"
} else {
    Write-Log "✗ MySQL 未安装或不在 PATH 中" "Warning"
    Write-Log "请确保 MySQL 已安装并添加到 PATH" "Warning"
}

Write-Log ""

# ============================================
# 第 2 步：创建项目目录
# ============================================
Write-Log "第 2 步：创建项目目录..." "Info"

$projectPath = "C:\othello\DHL"
$projectExists = Test-Path $projectPath

if ($projectExists) {
    Write-Log "项目目录已存在: $projectPath" "Warning"
    $choice = Read-Host "是否覆盖现有项目？(y/n)"
    if ($choice -ne "y") {
        Write-Log "取消部署" "Info"
        exit 0
    }
    Remove-Item -Path $projectPath -Recurse -Force
    Write-Log "✓ 已删除旧项目" "Success"
}

New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
Write-Log "✓ 项目目录已创建: $projectPath" "Success"
Write-Log ""

# ============================================
# 第 3 步：克隆代码仓库
# ============================================
Write-Log "第 3 步：克隆代码仓库..." "Info"

try {
    Set-Location $projectPath
    & git clone https://github.com/jackiechen33110/dhl.git .
    Write-Log "✓ 代码克隆成功" "Success"
} catch {
    Write-Log "✗ 克隆失败: $_" "Error"
    exit 1
}

Write-Log ""

# ============================================
# 第 4 步：安装依赖
# ============================================
Write-Log "第 4 步：安装 npm 依赖..." "Info"
Write-Log "这可能需要 2-5 分钟，请耐心等待..." "Info"

try {
    & npm install
    Write-Log "✓ 依赖安装成功" "Success"
} catch {
    Write-Log "✗ 依赖安装失败: $_" "Error"
    Write-Log "尝试清除缓存并重试..." "Warning"
    & npm cache clean --force
    & npm install
    Write-Log "✓ 依赖安装成功（重试）" "Success"
}

Write-Log ""

# ============================================
# 第 5 步：配置环境变量
# ============================================
Write-Log "第 5 步：配置环境变量..." "Info"

$envFile = "$projectPath\.env"

if (Test-Path $envFile) {
    Write-Log ".env 文件已存在" "Warning"
    $choice = Read-Host "是否覆盖？(y/n)"
    if ($choice -ne "y") {
        Write-Log "跳过 .env 配置" "Info"
        Write-Log ""
    } else {
        Remove-Item $envFile
    }
} else {
    # 创建 .env 文件
    $envContent = @"
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
SESSION_SECRET=change-this-to-random-string

# 日志配置
LOG_LEVEL=info
"@

    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Log "✓ .env 文件已创建" "Success"
    Write-Log "⚠️  请编辑 .env 文件并设置正确的数据库密码" "Warning"
    Write-Log ""
}

# ============================================
# 第 6 步：初始化数据库
# ============================================
Write-Log "第 6 步：初始化数据库..." "Info"

$sqlFile = "$projectPath\sql\init.sql"

if (Test-Path $sqlFile) {
    $choice = Read-Host "是否执行数据库初始化？(y/n)"
    if ($choice -eq "y") {
        try {
            # 读取 .env 获取数据库密码
            $envContent = Get-Content $envFile
            $dbPassword = ($envContent | Select-String "DB_PASSWORD=(.+)").Matches.Groups[1].Value
            
            if ([string]::IsNullOrEmpty($dbPassword) -or $dbPassword -eq "your_mysql_password") {
                Write-Log "✗ 请先在 .env 文件中设置正确的 MySQL 密码" "Error"
                Write-Log "然后运行以下命令初始化数据库:" "Info"
                Write-Log "mysql -u root -p < $sqlFile" "Info"
            } else {
                & mysql -u root -p=$dbPassword < $sqlFile
                Write-Log "✓ 数据库初始化成功" "Success"
            }
        } catch {
            Write-Log "✗ 数据库初始化失败: $_" "Error"
            Write-Log "请手动执行以下命令:" "Info"
            Write-Log "mysql -u root -p < $sqlFile" "Info"
        }
    } else {
        Write-Log "跳过数据库初始化" "Info"
        Write-Log "请手动执行以下命令初始化数据库:" "Warning"
        Write-Log "mysql -u root -p < $sqlFile" "Warning"
    }
} else {
    Write-Log "✗ SQL 初始化脚本未找到" "Error"
}

Write-Log ""

# ============================================
# 第 7 步：测试应用
# ============================================
Write-Log "第 7 步：测试应用启动..." "Info"

$choice = Read-Host "是否测试启动应用？(y/n)"
if ($choice -eq "y") {
    try {
        Write-Log "启动应用（10 秒后自动停止）..." "Info"
        
        $process = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $projectPath -NoNewWindow -PassThru
        Start-Sleep -Seconds 10
        Stop-Process -Id $process.Id -Force
        
        Write-Log "✓ 应用启动成功" "Success"
    } catch {
        Write-Log "✗ 应用启动失败: $_" "Error"
    }
}

Write-Log ""

# ============================================
# 第 8 步：配置 Windows 服务（可选）
# ============================================
Write-Log "第 8 步：配置 Windows 服务..." "Info"

$choice = Read-Host "是否安装 PM2 并配置为 Windows 服务？(y/n)"
if ($choice -eq "y") {
    try {
        Write-Log "安装 PM2..." "Info"
        & npm install -g pm2
        
        Write-Log "启动应用..." "Info"
        & pm2 start server.js --name "dhl-retour" --cwd $projectPath
        
        Write-Log "配置开机启动..." "Info"
        & pm2 startup
        & pm2 save
        
        Write-Log "✓ PM2 配置成功" "Success"
        Write-Log "应用将在开机时自动启动" "Success"
    } catch {
        Write-Log "✗ PM2 配置失败: $_" "Error"
        Write-Log "您可以稍后手动配置" "Warning"
    }
} else {
    Write-Log "跳过 PM2 配置" "Info"
    Write-Log "您可以稍后运行以下命令手动启动:" "Info"
    Write-Log "npm start" "Info"
}

Write-Log ""

# ============================================
# 部署完成
# ============================================
Write-Log "========================================" "Success"
Write-Log "✓ DHL 回邮单系统部署完成！" "Success"
Write-Log "========================================" "Success"
Write-Log ""

Write-Log "📋 后续步骤:" "Info"
Write-Log "1. 编辑 .env 文件，设置正确的数据库密码" "Info"
Write-Log "2. 执行数据库初始化: mysql -u root -p < sql\init.sql" "Info"
Write-Log "3. 启动应用: npm start" "Info"
Write-Log "4. 访问系统: http://localhost:3000" "Info"
Write-Log ""

Write-Log "🔐 默认登录凭证:" "Info"
Write-Log "用户名: admin" "Info"
Write-Log "密码: admin123" "Info"
Write-Log ""

Write-Log "📚 文档位置:" "Info"
Write-Log "快速开始: $projectPath\QUICK_START.md" "Info"
Write-Log "完整部署指南: $projectPath\DEPLOYMENT_GUIDE_CN.md" "Info"
Write-Log "页面结构说明: $projectPath\PAGE_STRUCTURE.md" "Info"
Write-Log ""

Write-Log "💡 常用命令:" "Info"
Write-Log "启动应用: npm start" "Info"
Write-Log "开发模式: npm run dev" "Info"
Write-Log "查看 PM2 状态: pm2 status" "Info"
Write-Log "查看日志: pm2 logs dhl-retour" "Info"
Write-Log ""

Write-Log "需要帮助？请参考文档或联系技术支持。" "Info"
Write-Log ""

# 打开项目目录
$choice = Read-Host "是否打开项目文件夹？(y/n)"
if ($choice -eq "y") {
    Invoke-Item $projectPath
}

Write-Log "部署脚本执行完成！" "Success"
