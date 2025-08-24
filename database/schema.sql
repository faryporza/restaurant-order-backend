-- Restaurant Order Management System Database Schema
-- Execute this script to create all necessary tables

-- 👤 Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🍽 Dining Tables
CREATE TABLE dining_tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    status BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_table ENUM('active', 'deleted') DEFAULT 'active'
);

-- 📂 Category
CREATE TABLE category (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'deleted') DEFAULT 'active'
);

-- 🥘 Menu Items
CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    img VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES category(id),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'deleted') DEFAULT 'active'
);

-- 🔑 Pin
CREATE TABLE pin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pin VARCHAR(100) NOT NULL,
    id_table INT,
    FOREIGN KEY (id_table) REFERENCES dining_tables(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_pin ENUM('active','inactive') DEFAULT 'active',
    status_pay ENUM('paid','unpaid') DEFAULT 'unpaid'
);

-- 📝 Orders
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_pin INT,
    FOREIGN KEY (id_pin) REFERENCES pin(id),
    id_table INT,
    FOREIGN KEY (id_table) REFERENCES dining_tables(id),
    menu_item_id INT,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    note TEXT,
    amount INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending','cooking','served','completed','cancel') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 💳 Total Orders
CREATE TABLE total_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_pin INT,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('paid','unpaid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pin) REFERENCES pin(id)
);

-- 📊 Daily Sales
CREATE TABLE daily_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    order_count INT DEFAULT 0,
    average_order DECIMAL(10,2) DEFAULT 0,
    customer_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- 📈 Monthly Sales
CREATE TABLE monthly_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    month INT NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    order_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month (year, month)
);

-- 📂 Category Stats
CREATE TABLE category_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id),
    UNIQUE KEY unique_category (category_id)
);

-- 🥘 Menu Stats
CREATE TABLE menu_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id INT NOT NULL,
    total_quantity INT DEFAULT 0,
    total_sales DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    UNIQUE KEY unique_menu_item (menu_item_id)
);

-- 💬 Messages Table (Optional for Socket.IO chat feature)
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔍 Create indexes for better performance
CREATE INDEX idx_dining_tables_status ON dining_tables(status_table);
CREATE INDEX idx_category_status ON category(status);
CREATE INDEX idx_menu_items_status ON menu_items(status);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_pin_status ON pin(status_pin);
CREATE INDEX idx_pin_table ON pin(id_table);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pin ON orders(id_pin);
CREATE INDEX idx_orders_table ON orders(id_table);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_daily_sales_date ON daily_sales(date);
CREATE INDEX idx_monthly_sales_year_month ON monthly_sales(year, month);

-- ✨ Insert default admin user (password: 1234)
-- Note: In production, use bcrypt to hash the password
INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@admin.com', '$2b$10$rQ6LiNZlwgOZzlmgKqgq7uHrXq4LHH9w9sQf.yQxE5kCZhqK6tJZm', 'admin');

-- 📝 Insert sample categories
INSERT INTO category (name) VALUES 
('เครื่องดื่ม'),
('อาหารหลัก'),
('ของหวาน'),
('อาหารเรียกน้ำย่อย');

-- 🍽 Insert sample tables
INSERT INTO dining_tables (name) VALUES 
('โต๊ะ 1'),
('โต๊ะ 2'),
('โต๊ะ 3'),
('โต๊ะ 4'),
('โต๊ะ 5');

-- 📋 Sample menu items (you can uncomment and modify as needed)
/*
INSERT INTO menu_items (name, price, category_id, is_available) VALUES 
('ข้าวผัดกุ้ง', 120.00, 2, true),
('ส้มตำไทย', 80.00, 4, true),
('กะเพราหมู', 90.00, 2, true),
('น้ำมะนาว', 30.00, 1, true),
('ไอศกรีมวานิลลา', 45.00, 3, true);
*/
