-- 创建数据库
CREATE DATABASE IF NOT EXISTS dhl_retour CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dhl_retour;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  role ENUM('staff', 'admin') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  country_code VARCHAR(2) DEFAULT 'DE',
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_code (customer_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 国家规则表
CREATE TABLE IF NOT EXISTS country_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  iso2 VARCHAR(2) NOT NULL UNIQUE,
  iso3 VARCHAR(3) NOT NULL,
  english_name VARCHAR(255) NOT NULL,
  chinese_name VARCHAR(255) NOT NULL,
  cn23_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CN23 产品库表
CREATE TABLE IF NOT EXISTS cn23_product_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hs_code VARCHAR(20),
  origin_country VARCHAR(2) DEFAULT 'CN',
  net_weight_kg DECIMAL(10,3),
  unit_value DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 回邮单表
CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_no VARCHAR(255),
  country VARCHAR(2) NOT NULL,
  city VARCHAR(255) NOT NULL,
  postcode VARCHAR(20) NOT NULL,
  street VARCHAR(255) NOT NULL,
  house_no VARCHAR(50),
  product VARCHAR(255),
  quantity INT DEFAULT 1,
  declared_value DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  classification ENUM('DE_DOMESTIC', 'NON_DE_NO_CN23', 'NON_DE_CN23', 'UNKNOWN') DEFAULT 'UNKNOWN',
  need_customs BOOLEAN DEFAULT FALSE,
  status ENUM('imported', 'validated', 'label_ready', 'exported', 'error') DEFAULT 'imported',
  label_pdf_path VARCHAR(500),
  dhl_tracking_no VARCHAR(255),
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 回邮单明细表（CN23 产品）
CREATE TABLE IF NOT EXISTS shipment_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL,
  line_no INT DEFAULT 1,
  description TEXT,
  hs_code VARCHAR(20),
  origin_country VARCHAR(2) DEFAULT 'CN',
  quantity INT DEFAULT 1,
  net_weight_kg DECIMAL(10,3),
  unit_value DECIMAL(10,2),
  total_value DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  INDEX idx_shipment_id (shipment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CN23 表单数据表
CREATE TABLE IF NOT EXISTS cn23_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT NOT NULL UNIQUE,
  total_value DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  reason_for_export VARCHAR(255),
  incoterm VARCHAR(10),
  form_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INT,
  details TEXT,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入欧洲29国规则数据
INSERT INTO country_rules (iso2, iso3, english_name, chinese_name, cn23_required) VALUES
('AT', 'AUT', 'Austria', '奥地利', 0),
('BE', 'BEL', 'Belgium', '比利时', 0),
('BG', 'BGR', 'Bulgaria', '保加利亚', 0),
('HR', 'HRV', 'Croatia', '克罗地亚', 0),
('CY', 'CYP', 'Cyprus', '塞浦路斯', 0),
('CZ', 'CZE', 'Czech Republic', '捷克共和国', 0),
('DK', 'DNK', 'Denmark', '丹麦', 0),
('DE', 'DEU', 'Germany', '德国', 0),
('EE', 'EST', 'Estonia', '爱沙尼亚', 0),
('FI', 'FIN', 'Finland', '芬兰', 0),
('FR', 'FRA', 'France', '法国', 0),
('GB', 'GBR', 'Great Britain', '英国', 1),
('GR', 'GRC', 'Greece', '希腊', 0),
('HU', 'HUN', 'Hungary', '匈牙利', 0),
('IE', 'IRL', 'Ireland', '爱尔兰', 1),
('IT', 'ITA', 'Italy', '意大利', 0),
('LV', 'LVA', 'Latvia', '拉脱维亚', 0),
('LT', 'LTU', 'Lithuania', '立陶宛', 0),
('LU', 'LUX', 'Luxembourg', '卢森堡', 0),
('MT', 'MLT', 'Malta', '马耳他', 0),
('NL', 'NLD', 'Netherlands', '荷兰', 0),
('NO', 'NOR', 'Norway', '挪威', 1),
('PL', 'POL', 'Poland', '波兰', 0),
('PT', 'PRT', 'Portugal', '葡萄牙', 0),
('RO', 'ROU', 'Romania', '罗马尼亚', 0),
('SK', 'SVK', 'Slovakia', '斯洛伐克', 0),
('SI', 'SVN', 'Slovenia', '斯洛文尼亚', 0),
('ES', 'ESP', 'Spain', '西班牙', 0),
('SE', 'SWE', 'Sweden', '瑞典', 1),
('CH', 'CHE', 'Switzerland', '瑞士', 1);

-- 插入默认管理员用户（密码为 admin123）
INSERT INTO users (username, password_hash, full_name, email, role) VALUES
('admin', 'admin123', '系统管理员', 'admin@dhl.local', 'admin');
