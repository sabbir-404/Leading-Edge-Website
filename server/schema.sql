
CREATE DATABASE IF NOT EXISTS furniture_shop;
USE furniture_shop;

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    image TEXT,
    parent_id VARCHAR(50),
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    on_sale BOOLEAN DEFAULT FALSE,
    description TEXT,
    short_description TEXT,
    model_number VARCHAR(100),
    image TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_categories (
    product_id VARCHAR(50),
    category_name VARCHAR(255),
    PRIMARY KEY (product_id, category_name),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50),
    image_url TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- For real auth
    role ENUM('admin', 'customer', 'moderator') DEFAULT 'customer',
    phone VARCHAR(50),
    address TEXT,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    shipping_address TEXT,
    total DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pending',
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Categories Seed
INSERT IGNORE INTO categories (id, name, slug, parent_id, is_featured, sort_order) VALUES
('1', 'Furniture', 'furniture', NULL, TRUE, 1),
('2', 'Light', 'light', NULL, TRUE, 2),
('3', 'Kitchenware', 'kitchenware', NULL, TRUE, 3),
('1-1', 'Sofa', 'sofa', '1', FALSE, 0),
('1-2', 'Bed', 'bed', '1', FALSE, 0);
