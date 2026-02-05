# DHL 回邮单管理系统

一个完整的 DHL 回邮单管理系统，用于处理跨境电商的退货物流和报关流程。

## 技术栈

- **后端**: Node.js + Express
- **前端**: EJS 模板引擎 + HTML/CSS/JavaScript
- **数据库**: MySQL
- **文件上传**: Multer
- **Excel 处理**: XLSX

## 功能模块

### 1. 用户认证系统
- 员工和管理员两种角色
- 基于 Session 的认证
- 权限控制

### 2. 客户管理
- 客户信息的增删改查
- 客户代码唯一性验证
- 客户分类统计

### 3. 回邮单管理
- 批量导入（CSV/Excel）
- 手工录入
- 回邮单查询和筛选
- 状态管理（已导入、已验证、标签已生成、已导出、错误）

### 4. 国家规则管理
- 欧洲 29 国规则配置
- CN23 报关单自动识别
- 国家信息维护

### 5. CN23 报关单
- 产品库管理
- 报关信息录入
- 表单数据保存

### 6. 数据校验
- 必填字段检查
- 国家代码验证
- 地址完整性检查

### 7. 统计汇总
- 按状态统计
- 按日期统计
- 按客户分类统计

### 8. 操作日志
- 用户操作追踪
- 关键操作记录
- 日志查询

## 项目结构

```
dhl-retour-system/
├── server.js              # 主服务器文件
├── db.js                  # 数据库连接
├── package.json           # 项目依赖
├── routes/                # API 路由
│   ├── auth.js           # 认证路由
│   ├── customers.js      # 客户管理路由
│   ├── shipments.js      # 回邮单管理路由
│   ├── countries.js      # 国家规则路由
│   ├── cn23.js           # CN23 产品库路由
│   └── logs.js           # 操作日志路由
├── views/                 # EJS 模板
│   ├── login.ejs         # 登录页面
│   ├── dashboard.ejs     # 仪表板
│   ├── partials/         # 页面部分
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── 404.ejs           # 404 页面
│   └── error.ejs         # 错误页面
├── public/                # 静态文件
│   ├── css/
│   │   └── style.css     # 全局样式
│   ├── js/               # 前端脚本
│   └── uploads/          # 上传文件目录
└── sql/
    └── init.sql          # 数据库初始化脚本
```

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 创建数据库

使用 MySQL 客户端执行 `sql/init.sql` 文件：

```bash
mysql -u root -p < sql/init.sql
```

### 3. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dhl_retour
SESSION_SECRET=your-secret-key
```

### 4. 启动服务器

**开发模式**（带热重载）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

服务器将运行在 `http://localhost:3000`

## 默认账户

- **用户名**: admin
- **密码**: admin123
- **角色**: 管理员

## API 文档

### 认证 API

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 获取当前用户
```
GET /api/auth/me
```

#### 登出
```
POST /api/auth/logout
```

### 客户管理 API

#### 获取所有客户
```
GET /api/customers
```

#### 创建客户
```
POST /api/customers
Content-Type: application/json

{
  "customer_code": "CUST001",
  "name": "客户名称",
  "remark": "备注"
}
```

#### 删除客户
```
DELETE /api/customers/:id
```

### 回邮单管理 API

#### 获取回邮单列表
```
GET /api/shipments?customer_id=1&status=imported&page=1&limit=50
```

#### 创建回邮单
```
POST /api/shipments
Content-Type: application/json

{
  "customer_id": 1,
  "order_no": "ORD001",
  "country": "DE",
  "city": "Berlin",
  "postcode": "10115",
  "street": "Hauptstr.",
  "house_no": "1",
  "product": "T-Shirt",
  "quantity": 1,
  "declared_value": 50,
  "classification": "NON_DE_CN23"
}
```

#### 批量创建回邮单
```
POST /api/shipments/bulk
Content-Type: application/json

{
  "rows": [
    {
      "customerId": 1,
      "orderNo": "ORD001",
      "country": "DE",
      "city": "Berlin",
      "postcode": "10115",
      "street": "Hauptstr.",
      "houseNo": "1",
      "product": "T-Shirt",
      "qty": 1,
      "value": 50
    }
  ]
}
```

#### 更新回邮单状态
```
PATCH /api/shipments/:id/status
Content-Type: application/json

{
  "status": "validated"
}
```

#### 获取回邮单详情
```
GET /api/shipments/:id
```

### 国家规则 API

#### 获取所有国家
```
GET /api/countries
```

#### 获取需要 CN23 的国家
```
GET /api/countries/cn23
```

### CN23 产品库 API

#### 获取产品列表
```
GET /api/cn23/products?q=search_query
```

#### 创建产品
```
POST /api/cn23/products
Content-Type: application/json

{
  "name": "产品名称",
  "description": "描述",
  "hs_code": "6204620000",
  "origin_country": "CN",
  "net_weight_kg": 0.5,
  "unit_value": 50,
  "currency": "EUR"
}
```

#### 更新产品
```
PUT /api/cn23/products/:id
Content-Type: application/json

{
  "name": "新名称",
  "unit_value": 60
}
```

#### 删除产品
```
DELETE /api/cn23/products/:id
```

### CN23 表单 API

#### 获取表单
```
GET /api/cn23/forms/:shipment_id
```

#### 保存表单
```
POST /api/cn23/forms/:shipment_id
Content-Type: application/json

{
  "total_value": 50,
  "currency": "EUR",
  "reason_for_export": "Return",
  "incoterm": "DDP",
  "form_data": { ... }
}
```

### 操作日志 API

#### 获取日志
```
GET /api/logs?page=1&limit=50
```

#### 记录操作
```
POST /api/logs
Content-Type: application/json

{
  "action": "create_shipment",
  "target_type": "shipment",
  "target_id": 1,
  "details": "Created shipment for customer 1"
}
```

## 数据库表结构

### users 表
- id: 主键
- username: 用户名
- password_hash: 密码哈希
- full_name: 全名
- email: 邮箱
- role: 角色 (staff/admin)
- created_at: 创建时间
- updated_at: 更新时间

### customers 表
- id: 主键
- customer_code: 客户代码（唯一）
- name: 客户名称
- country_code: 国家代码
- remark: 备注
- created_at: 创建时间
- updated_at: 更新时间

### shipments 表
- id: 主键
- customer_id: 客户 ID
- order_no: 订单号
- country: 国家代码
- city: 城市
- postcode: 邮编
- street: 街道
- house_no: 房号
- product: 产品名称
- quantity: 数量
- declared_value: 申报价值
- currency: 货币
- classification: 分类
- need_customs: 是否需要报关
- status: 状态
- label_pdf_path: 标签 PDF 路径
- dhl_tracking_no: DHL 跟踪号
- remark: 备注
- created_at: 创建时间
- updated_at: 更新时间

### shipment_items 表
- id: 主键
- shipment_id: 回邮单 ID
- line_no: 行号
- description: 描述
- hs_code: HS 代码
- origin_country: 原产国
- quantity: 数量
- net_weight_kg: 净重
- unit_value: 单价
- total_value: 总价
- created_at: 创建时间
- updated_at: 更新时间

### cn23_product_library 表
- id: 主键
- name: 产品名称
- description: 描述
- hs_code: HS 代码
- origin_country: 原产国
- net_weight_kg: 净重
- unit_value: 单价
- currency: 货币
- active: 是否活跃
- created_at: 创建时间
- updated_at: 更新时间

### country_rules 表
- id: 主键
- iso2: ISO 2 代码
- iso3: ISO 3 代码
- english_name: 英文名称
- chinese_name: 中文名称
- cn23_required: 是否需要 CN23
- created_at: 创建时间

### cn23_forms 表
- id: 主键
- shipment_id: 回邮单 ID（唯一）
- total_value: 总价值
- currency: 货币
- reason_for_export: 出口原因
- incoterm: 贸易术语
- form_data: 表单数据（JSON）
- created_at: 创建时间
- updated_at: 更新时间

### operation_logs 表
- id: 主键
- user_id: 用户 ID
- action: 操作类型
- target_type: 目标类型
- target_id: 目标 ID
- details: 详情
- ip: IP 地址
- created_at: 创建时间

## 部署到 Windows 服务器

### 1. 安装 Node.js 和 MySQL

从官方网站下载并安装 Node.js 和 MySQL。

### 2. 克隆或上传项目

```bash
git clone <repository-url>
cd dhl-retour-system
npm install
```

### 3. 创建数据库

```bash
mysql -u root -p < sql/init.sql
```

### 4. 配置 .env 文件

根据您的 MySQL 配置修改 `.env` 文件。

### 5. 使用 PM2 管理进程（可选）

```bash
npm install -g pm2
pm2 start server.js --name "dhl-retour"
pm2 startup
pm2 save
```

### 6. 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 常见问题

### Q: 如何修改默认管理员密码？

A: 直接在 MySQL 中更新 users 表：
```sql
UPDATE users SET password_hash = 'new_password' WHERE username = 'admin';
```

### Q: 如何添加新用户？

A: 在 MySQL 中插入新用户记录：
```sql
INSERT INTO users (username, password_hash, full_name, email, role) 
VALUES ('username', 'password', 'Full Name', 'email@example.com', 'staff');
```

### Q: 如何导出回邮单为 PDF？

A: 目前系统预留了 PDF 导出接口，可以使用 `pdfkit` 或 `puppeteer` 库实现。

### Q: 系统如何与 DHL API 集成？

A: DHL API 集成接口已预留在代码中，可以在 `routes/shipments.js` 中添加 DHL API 调用逻辑。

## 许可证

MIT

## 支持

如有问题或建议，请联系开发团队。
