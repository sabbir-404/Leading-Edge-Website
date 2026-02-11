
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // API Server Port (Keep as 3001)

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Database Config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'furniture_shop',
  port: process.env.DB_PORT || 3306, // MySQL Port (Standard is 3306)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Startup Check & Seed
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database on port 3306 successfully!');
    
    // Auto-migration: Check if extra_data column exists, if not add it
    try {
        await connection.query('SELECT extra_data FROM products LIMIT 1');
    } catch (e) {
        console.log('⚠️ extra_data column missing. Attempting to add...');
        await connection.query('ALTER TABLE products ADD COLUMN extra_data LONGTEXT');
        console.log('✅ extra_data column added.');
    }

    // Seed Admin User if table is empty
    try {
        const [users] = await connection.query('SELECT * FROM users LIMIT 1');
        if (users.length === 0) {
            // Default Admin: admin@leadingedge.com / admin123
            await connection.query("INSERT INTO users (id, name, email, password_hash, role, join_date) VALUES ('u-admin', 'Admin User', 'admin@leadingedge.com', 'admin123', 'admin', NOW())");
            console.log('✅ Default admin user created (admin@leadingedge.com / admin123)');
        }
    } catch (e) {
        console.log('⚠️ Error checking users table: ' + e.message);
    }

    connection.release();
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
    console.log('Ensure XAMPP MySQL is running on port 3306.');
  }
})();

// --- PRODUCTS ROUTES ---

// Get Products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    
    for (let product of rows) {
       // Fetch Relations
       const [cats] = await pool.query('SELECT category_name FROM product_categories WHERE product_id = ?', [product.id]);
       product.categories = cats.map(c => c.category_name);
       
       const [imgs] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
       product.images = imgs.map(i => i.image_url);
       
       // Parse JSON Extra Data
       if (product.extra_data) {
           try {
               const extra = JSON.parse(product.extra_data);
               product.variations = extra.variations || [];
               product.specifications = extra.specifications || [];
               product.customTabs = extra.customTabs || [];
               product.features = extra.features || [];
               product.weight = extra.weight || 0;
               product.specificShippingCharges = extra.specificShippingCharges || [];
               product.rating = extra.rating || 5;
           } catch (e) {
               console.error("Error parsing extra_data for product " + product.id, e);
           }
       }
       
       // Ensure arrays exist if null
       if (!product.variations) product.variations = [];
       if (!product.specifications) product.specifications = [];
       if (!product.customTabs) product.customTabs = [];

       // Boolean conversion
       product.onSale = Boolean(product.on_sale);
       product.isVisible = Boolean(product.is_visible);
       // CamelCase Mapping
       product.salePrice = product.sale_price;
       product.shortDescription = product.short_description;
       product.modelNumber = product.model_number;
    }
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Create Product
app.post('/api/products', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const p = req.body;
        
        // Prepare extra data JSON
        const extraData = JSON.stringify({
            variations: p.variations || [],
            specifications: p.specifications || [],
            customTabs: p.customTabs || [],
            features: p.features || [],
            weight: p.weight || 0,
            specificShippingCharges: p.specificShippingCharges || [],
            rating: p.rating || 5
        });

        await conn.query(
            'INSERT INTO products (id, name, price, sale_price, on_sale, description, short_description, model_number, image, is_visible, extra_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [p.id, p.name, p.price, p.salePrice, p.onSale, p.description, p.shortDescription, p.modelNumber, p.image, p.isVisible, extraData]
        );

        // Categories
        if (p.categories && p.categories.length > 0) {
            for (const cat of p.categories) {
                await conn.query('INSERT INTO product_categories (product_id, category_name) VALUES (?, ?)', [p.id, cat]);
            }
        }

        // Images
        if (p.images && p.images.length > 0) {
            for (const img of p.images) {
                if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [p.id, img]);
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Product created', id: p.id });
    } catch (error) {
        await conn.rollback();
        console.error("Create Product Error:", error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

// Update Product
app.put('/api/products/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const p = req.body;
        const id = req.params.id;

        const extraData = JSON.stringify({
            variations: p.variations || [],
            specifications: p.specifications || [],
            customTabs: p.customTabs || [],
            features: p.features || [],
            weight: p.weight || 0,
            specificShippingCharges: p.specificShippingCharges || [],
            rating: p.rating || 5
        });

        await conn.query(
            'UPDATE products SET name=?, price=?, sale_price=?, on_sale=?, description=?, short_description=?, model_number=?, image=?, is_visible=?, extra_data=? WHERE id=?',
            [p.name, p.price, p.salePrice, p.onSale, p.description, p.shortDescription, p.modelNumber, p.image, p.isVisible, extraData, id]
        );

        // Update Categories (Delete all and re-insert)
        await conn.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
        if (p.categories && p.categories.length > 0) {
            for (const cat of p.categories) {
                await conn.query('INSERT INTO product_categories (product_id, category_name) VALUES (?, ?)', [id, cat]);
            }
        }

        // Update Images (Delete all and re-insert)
        await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        if (p.images && p.images.length > 0) {
            for (const img of p.images) {
               if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, img]);
            }
        }

        await conn.commit();
        res.json({ message: 'Product updated' });
    } catch (error) {
        await conn.rollback();
        console.error("Update Product Error:", error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- CATEGORY ROUTES ---

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
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
    try {
        const c = req.body;
        await pool.query(
            'INSERT INTO categories (id, name, slug, image, parent_id, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [c.id, c.name, c.slug, c.image, c.parentId, c.isFeatured, c.order]
        );
        res.status(201).json({ message: 'Category created' });
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const c = req.body;
        await pool.query(
            'UPDATE categories SET name=?, slug=?, image=?, parent_id=?, is_featured=?, sort_order=? WHERE id=?',
            [c.name, c.slug, c.image, c.parentId, c.isFeatured, c.order, req.params.id]
        );
        res.json({ message: 'Category updated' });
    } catch (error) {
        console.error("Update Category Error:", error);
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error("Delete Category Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- USER ROUTES ---

// Get Users
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, role, phone, address, join_date FROM users');
        const users = rows.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role,
            phone: r.phone,
            address: r.address,
            joinDate: r.join_date
        }));
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create User
app.post('/api/users', async (req, res) => {
    try {
        const u = req.body;
        // In real app, hash password here. Storing plain for demo compatibility
        await pool.query(
            'INSERT INTO users (id, name, email, password_hash, role, phone, address, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [u.id, u.name, u.email, u.password || '123456', u.role, u.phone, u.address]
        );
        res.status(201).json({ message: 'User created' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    try {
        const u = req.body;
        if (u.password) {
             await pool.query(
                'UPDATE users SET name=?, email=?, password_hash=?, role=?, phone=?, address=? WHERE id=?',
                [u.name, u.email, u.password, u.role, u.phone, u.address, req.params.id]
            );
        } else {
             await pool.query(
                'UPDATE users SET name=?, email=?, role=?, phone=?, address=? WHERE id=?',
                [u.name, u.email, u.role, u.phone, u.address, req.params.id]
            );
        }
        res.json({ message: 'User updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- ORDER ROUTES ---

app.post('/api/orders', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const order = req.body;
    
    await conn.query(
      'INSERT INTO orders (id, user_id, customer_name, customer_email, shipping_address, total, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [order.id, order.userId, order.customerName, order.customerEmail, order.shippingAddress, order.total, 'Pending', 'Unpaid']
    );
    await conn.commit();
    res.status(201).json({ message: 'Order created', id: order.id });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            // Verify password (plain text check for demo)
            if (user.password_hash === password) { 
                 res.json({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    joinDate: user.join_date
                });
                return;
            }
        }
        res.status(401).json({ message: 'Invalid credentials' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
