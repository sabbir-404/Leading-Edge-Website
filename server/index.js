
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database Config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'furniture_shop',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// --- HELPERS ---

// Audit Log Helper
async function logAction(connection, adminEmail, actionType, targetId, details) {
    try {
        const query = 'INSERT INTO audit_logs (admin_email, action_type, target_id, details) VALUES (?, ?, ?, ?)';
        // If connection is a pool, use execute, if it's a transaction connection, use query/execute
        await connection.query(query, [adminEmail || 'system', actionType, targetId, JSON.stringify(details)]);
    } catch (e) {
        console.error("Failed to write audit log:", e);
    }
}

// Validation Helper
async function checkExists(table, column, value, excludeId = null) {
    let query = `SELECT id FROM ${table} WHERE ${column} = ?`;
    const params = [value];
    if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
}

// --- STARTUP SEEDING ---
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database on port 3306 successfully!');
    
    // Ensure Tables Exist (simplified check)
    try {
        await connection.query('SELECT 1 FROM related_products LIMIT 1');
    } catch (e) {
        console.log('⚠️ Missing tables detected. Please run schema.sql manually if not using a migration tool.');
    }

    // Seed Admin
    const [users] = await connection.query('SELECT * FROM users WHERE role="admin"');
    if (users.length === 0) {
        console.log('🌱 Seeding Admin User...');
        await connection.query(
            "INSERT INTO users (id, name, email, password_hash, role, join_date) VALUES (?, ?, ?, ?, ?, NOW())",
            ['u-admin', 'Super Admin', 'admin@leadingedge.com', 'admin123', 'admin']
        );
    }

    // Seed Categories if empty
    const [cats] = await connection.query('SELECT * FROM categories');
    if (cats.length === 0) {
        console.log('🌱 Seeding Categories...');
        const categories = [
            { id: '1', name: 'Furniture', slug: 'furniture', is_featured: 1, sort_order: 1 },
            { id: '2', name: 'Light', slug: 'light', is_featured: 1, sort_order: 2 },
            { id: '3', name: 'Kitchenware', slug: 'kitchenware', is_featured: 1, sort_order: 3 }
        ];
        for(const c of categories) {
            await connection.query('INSERT INTO categories (id, name, slug, is_featured, sort_order) VALUES (?,?,?,?,?)', 
                [c.id, c.name, c.slug, c.is_featured, c.sort_order]);
        }
    }

    connection.release();
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
  }
})();

// --- ROUTES ---

// 1. PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    
    for (let product of rows) {
       // Relations
       const [cats] = await pool.query('SELECT category_name FROM product_categories WHERE product_id = ?', [product.id]);
       product.categories = cats.map(c => c.category_name);
       
       const [imgs] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
       product.images = imgs.map(i => i.image_url);

       const [related] = await pool.query('SELECT related_product_id FROM related_products WHERE product_id = ?', [product.id]);
       product.relatedProducts = related.map(r => r.related_product_id);
       
       // Parse JSON
       if (product.extra_data) {
           try {
               const extra = JSON.parse(product.extra_data);
               Object.assign(product, extra);
           } catch (e) {}
       }
       
       // Defaults
       product.variations = product.variations || [];
       product.specifications = product.specifications || [];
       product.customTabs = product.customTabs || [];
       product.onSale = Boolean(product.on_sale);
       product.isVisible = Boolean(product.is_visible);
       product.salePrice = product.sale_price;
       product.shortDescription = product.short_description;
       product.modelNumber = product.model_number;
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const p = req.body;
        const adminEmail = req.headers['x-admin-email']; // Passed from frontend

        // Validation
        if (await checkExists('products', 'id', p.id)) {
            throw new Error(`Product ID ${p.id} already exists.`);
        }

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

        if (p.categories) {
            for (const cat of p.categories) await conn.query('INSERT INTO product_categories VALUES (?, ?)', [p.id, cat]);
        }
        if (p.images) {
            for (const img of p.images) if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [p.id, img]);
        }
        if (p.relatedProducts) {
            for (const relId of p.relatedProducts) await conn.query('INSERT INTO related_products VALUES (?, ?)', [p.id, relId]);
        }

        await logAction(conn, adminEmail, 'CREATE_PRODUCT', p.id, { name: p.name });
        await conn.commit();
        res.status(201).json({ message: 'Product created' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

app.put('/api/products/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const p = req.body;
        const id = req.params.id;
        const adminEmail = req.headers['x-admin-email'];

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

        // Refresh Relations
        await conn.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
        if (p.categories) for (const cat of p.categories) await conn.query('INSERT INTO product_categories VALUES (?, ?)', [id, cat]);

        await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        if (p.images) for (const img of p.images) if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, img]);

        await conn.query('DELETE FROM related_products WHERE product_id = ?', [id]);
        if (p.relatedProducts) for (const relId of p.relatedProducts) await conn.query('INSERT INTO related_products VALUES (?, ?)', [id, relId]);

        await logAction(conn, adminEmail, 'UPDATE_PRODUCT', id, { name: p.name });
        await conn.commit();
        res.json({ message: 'Product updated' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const adminEmail = req.headers['x-admin-email'];
        await conn.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        await logAction(conn, adminEmail, 'DELETE_PRODUCT', req.params.id, {});
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

// 2. USERS
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

app.post('/api/users', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const u = req.body;
        const adminEmail = req.headers['x-admin-email'];

        if (await checkExists('users', 'email', u.email)) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        await conn.query(
            'INSERT INTO users (id, name, email, password_hash, role, phone, address, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [u.id, u.name, u.email, u.password || '123456', u.role, u.phone, u.address]
        );
        
        await logAction(conn, adminEmail, 'CREATE_USER', u.id, { email: u.email, role: u.role });
        res.status(201).json({ message: 'User created' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

app.put('/api/users/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const u = req.body;
        const adminEmail = req.headers['x-admin-email'];

        // Check if email changed and conflicts
        if (await checkExists('users', 'email', u.email, req.params.id)) {
            return res.status(409).json({ message: 'Email already taken by another user' });
        }

        if (u.password) {
             await conn.query(
                'UPDATE users SET name=?, email=?, password_hash=?, role=?, phone=?, address=? WHERE id=?',
                [u.name, u.email, u.password, u.role, u.phone, u.address, req.params.id]
            );
        } else {
             await conn.query(
                'UPDATE users SET name=?, email=?, role=?, phone=?, address=? WHERE id=?',
                [u.name, u.email, u.role, u.phone, u.address, req.params.id]
            );
        }
        await logAction(conn, adminEmail, 'UPDATE_USER', req.params.id, { email: u.email });
        res.json({ message: 'User updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// 3. CATEGORIES
app.get('/api/categories', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json(rows.map(r => ({
        id: r.id, name: r.name, slug: r.slug, image: r.image, parentId: r.parent_id, isFeatured: Boolean(r.is_featured), order: r.sort_order
    })));
});

app.post('/api/categories', async (req, res) => {
    const c = req.body;
    await pool.query('INSERT INTO categories (id, name, slug, image, parent_id, is_featured, sort_order) VALUES (?,?,?,?,?,?,?)', 
        [c.id, c.name, c.slug, c.image, c.parentId, c.isFeatured, c.order]);
    res.status(201).json({message: 'Created'});
});

app.put('/api/categories/:id', async (req, res) => {
    const c = req.body;
    await pool.query('UPDATE categories SET name=?, slug=?, image=?, parent_id=?, is_featured=?, sort_order=? WHERE id=?', 
        [c.name, c.slug, c.image, c.parentId, c.isFeatured, c.order, req.params.id]);
    res.json({message: 'Updated'});
});

app.delete('/api/categories/:id', async (req, res) => {
    await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({message: 'Deleted'});
});

// 4. PROJECTS
app.get('/api/projects', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM projects');
    res.json(rows.map(r => ({
        id: r.id, title: r.title, description: r.description, coverImage: r.cover_image, client: r.client, date: r.completion_date, images: JSON.parse(r.images || '[]')
    })));
});

app.post('/api/projects', async (req, res) => {
    const p = req.body;
    await pool.query('INSERT INTO projects (id, title, description, cover_image, client, completion_date, images) VALUES (?,?,?,?,?,?,?)',
        [p.id, p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images)]);
    res.status(201).json({message: 'Created'});
});

app.put('/api/projects/:id', async (req, res) => {
    const p = req.body;
    await pool.query('UPDATE projects SET title=?, description=?, cover_image=?, client=?, completion_date=?, images=? WHERE id=?',
        [p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images), req.params.id]);
    res.json({message: 'Updated'});
});

app.delete('/api/projects/:id', async (req, res) => {
    await pool.query('DELETE FROM projects WHERE id=?', [req.params.id]);
    res.json({message: 'Deleted'});
});

// 5. SITE CONFIG
app.get('/api/config', async (req, res) => {
    const [rows] = await pool.query('SELECT config_data FROM site_config WHERE id = "main-config"');
    if (rows.length > 0 && rows[0].config_data) {
        res.json(JSON.parse(rows[0].config_data));
    } else {
        res.json({}); // Return empty if not set yet
    }
});

app.post('/api/config', async (req, res) => {
    const configData = JSON.stringify(req.body);
    // Upsert logic
    await pool.query('INSERT INTO site_config (id, config_data) VALUES ("main-config", ?) ON DUPLICATE KEY UPDATE config_data=VALUES(config_data)', [configData]);
    res.json({message: 'Config saved'});
});

// 6. CUSTOM PAGES
app.get('/api/pages', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM custom_pages');
    res.json(rows.map(r => ({
        id: r.id, slug: r.slug, title: r.title, ...JSON.parse(r.content_json || '{}')
    })));
});

app.post('/api/pages', async (req, res) => {
    const p = req.body;
    const content = JSON.stringify({ hasHero: p.hasHero, heroImage: p.heroImage, sections: p.sections, placement: p.placement, isSystem: p.isSystem });
    await pool.query('INSERT INTO custom_pages (id, slug, title, content_json) VALUES (?,?,?,?)', [p.id, p.slug, p.title, content]);
    res.json({message: 'Page created'});
});

app.put('/api/pages/:id', async (req, res) => {
    const p = req.body;
    const content = JSON.stringify({ hasHero: p.hasHero, heroImage: p.heroImage, sections: p.sections, placement: p.placement, isSystem: p.isSystem });
    await pool.query('UPDATE custom_pages SET slug=?, title=?, content_json=? WHERE id=?', [p.slug, p.title, content, req.params.id]);
    res.json({message: 'Page updated'});
});

app.delete('/api/pages/:id', async (req, res) => {
    await pool.query('DELETE FROM custom_pages WHERE id=?', [req.params.id]);
    res.json({message: 'Page deleted'});
});

// 7. ORDERS (Basic)
app.get('/api/orders', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(r => ({
        id: r.id, userId: r.user_id, customerName: r.customer_name, customerEmail: r.customer_email, shippingAddress: r.shipping_address, total: r.total, status: r.status, paymentStatus: r.payment_status, date: r.created_at
    })));
});

app.post('/api/orders', async (req, res) => {
    const o = req.body;
    await pool.query('INSERT INTO orders (id, user_id, customer_name, customer_email, shipping_address, total, status, payment_status) VALUES (?,?,?,?,?,?,?,?)',
        [o.id, o.userId, o.customerName, o.customerEmail, o.shippingAddress, o.total, 'Pending', 'Unpaid']);
    res.status(201).json({message: 'Order Created'});
});

// 8. AUTH
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            if (user.password_hash === password) { // In prod, use bcrypt.compare
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
