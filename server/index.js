
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Config - Defaults for XAMPP
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // XAMPP default is empty
  database: process.env.DB_NAME || 'furniture_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test DB Connection on Startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully!');
    connection.release();
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
    console.log('Ensure XAMPP MySQL is running and database "furniture_shop" exists.');
  }
})();

// Routes

// Get Products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE is_visible = 1');
    
    // Fetch details for each product
    for (let product of rows) {
       // Categories
       const [cats] = await pool.query('SELECT category_name FROM product_categories WHERE product_id = ?', [product.id]);
       product.categories = cats.map(c => c.category_name);
       
       // Images
       const [imgs] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
       product.images = imgs.map(i => i.image_url);
       
       // Defaults for frontend types
       product.variations = []; 
       product.specifications = []; 
       product.customTabs = [];
    }
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get Categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    const categories = rows.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        image: r.image,
        parentId: r.parent_id,
        isFeatured: Boolean(r.is_featured),
        order: r.sort_order
    }));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const order = req.body;
    
    await conn.query(
      'INSERT INTO orders (id, user_id, customer_name, customer_email, shipping_address, total, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [order.id, order.userId, order.customerName, order.customerEmail, order.shippingAddress, order.total, 'Pending', 'Unpaid']
    );

    // In a full app, insert order items here...

    await conn.commit();
    res.status(201).json({ message: 'Order created', id: order.id });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// Auth Login (Mock)
app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    // Mock response
    res.json({
        id: 'u-' + Date.now(),
        name: email.split('@')[0],
        email: email,
        role: email.includes('admin') ? 'admin' : 'customer',
        joinDate: new Date().toISOString()
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
