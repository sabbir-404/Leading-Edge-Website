
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
    image LONGTEXT, 
    is_visible BOOLEAN DEFAULT TRUE,
    extra_data LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS related_products (
    product_id VARCHAR(50),
    related_product_id VARCHAR(50),
    PRIMARY KEY (product_id, related_product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE CASCADE
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
    image_url LONGTEXT, 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role ENUM('admin', 'customer', 'moderator', 'customer_service') DEFAULT 'customer',
    phone VARCHAR(50),
    address TEXT,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    shipping_address TEXT,
    subtotal DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pending',
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50),
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    quantity INT,
    price DECIMAL(10, 2),
    image LONGTEXT, 
    selected_variation LONGTEXT, 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    cover_image LONGTEXT, 
    client VARCHAR(255),
    completion_date VARCHAR(50),
    images LONGTEXT
);

CREATE TABLE IF NOT EXISTS site_config (
    id VARCHAR(50) PRIMARY KEY,
    config_data LONGTEXT
);

CREATE TABLE IF NOT EXISTS custom_pages (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    title VARCHAR(255),
    content_json LONGTEXT
);

CREATE TABLE IF NOT EXISTS shipping_areas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS shipping_methods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    flat_rate DECIMAL(10, 2),
    is_global BOOLEAN DEFAULT TRUE,
    area_ids LONGTEXT, 
    weight_rates LONGTEXT 
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    subject VARCHAR(255),
    content LONGTEXT, 
    sent_date DATE,
    recipient_count INT,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_email VARCHAR(255),
    action_type VARCHAR(50),
    target_id VARCHAR(50),
    details TEXT,
    changes LONGTEXT, 
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255),
    file_path TEXT,
    folder VARCHAR(50),
    file_size INT,
    mime_type VARCHAR(50),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
