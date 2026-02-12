
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

async function logAction(connection, adminEmail, actionType, targetId, details) {
    try {
        const query = 'INSERT INTO audit_logs (admin_email, action_type, target_id, details) VALUES (?, ?, ?, ?)';
        await connection.query(query, [adminEmail || 'system', actionType, targetId, JSON.stringify(details)]);
    } catch (e) {
        console.error("Failed to write audit log:", e);
    }
}

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

// Middleware for Admin Validation
const validateAdmin = async (req, res, next) => {
    // Basic validation, could verify session via DB or JWT if implemented.
    next();
};

app.use(validateAdmin);

// --- ROUTES ---

// --- DASHBOARD STATS ---
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            totalOrdersMonth: 0,
            totalVisitsMonth: 3420, // Mocked
            revenueMonth: 0,
            trendingProducts: [],
            recentActivity: []
        };

        const [monthData] = await pool.query(`
            SELECT COUNT(*) as count, SUM(total) as revenue 
            FROM orders 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);
        stats.totalOrdersMonth = monthData[0].count || 0;
        stats.revenueMonth = monthData[0].revenue || 0;

        const [trending] = await pool.query(`
            SELECT p.id, p.name, SUM(oi.quantity) as sales 
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY oi.product_id
            ORDER BY sales DESC
            LIMIT 5
        `);
        stats.trendingProducts = trending.map(t => ({ productId: t.id || 'N/A', name: t.name || 'Unknown Product', sales: Number(t.sales) }));

        const [recentLogs] = await pool.query(`
            (SELECT CONCAT('Order #', id, ' placed by ', customer_name) as activity, created_at as date FROM orders)
            UNION
            (SELECT CONCAT('Admin ', admin_email, ' performed ', action_type), timestamp as date FROM audit_logs)
            ORDER BY date DESC
            LIMIT 10
        `);
        stats.recentActivity = recentLogs.map(l => l.activity);

        res.json(stats);
    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- SHIPPING ---
app.get('/api/shipping/areas', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM shipping_areas');
    res.json(rows);
});

app.post('/api/shipping/areas', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const areas = req.body;
        await conn.query('DELETE FROM shipping_areas'); 
        for (const area of areas) {
            await conn.query('INSERT INTO shipping_areas (id, name) VALUES (?, ?)', [area.id, area.name]);
        }
        await conn.commit();
        res.json({ message: 'Shipping areas updated' });
    } catch(e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

app.get('/api/shipping/methods', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM shipping_methods');
    const methods = rows.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        flatRate: r.flat_rate,
        isGlobal: Boolean(r.is_global),
        areaIds: JSON.parse(r.area_ids || '[]'),
        weightRates: JSON.parse(r.weight_rates || '[]')
    }));
    res.json(methods);
});

app.post('/api/shipping/methods', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const methods = req.body;
        await conn.query('DELETE FROM shipping_methods');
        for (const m of methods) {
            await conn.query(
                'INSERT INTO shipping_methods (id, name, type, flat_rate, is_global, area_ids, weight_rates) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [m.id, m.name, m.type, m.flatRate, m.isGlobal, JSON.stringify(m.areaIds), JSON.stringify(m.weightRates)]
            );
        }
        await conn.commit();
        res.json({ message: 'Shipping methods updated' });
    } catch(e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// --- NEWSLETTER ---
app.get('/api/newsletters', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM newsletter_campaigns ORDER BY sent_date DESC');
    res.json(rows.map(r => ({
        id: r.id, subject: r.subject, content: r.content, sentDate: r.sent_date, recipientCount: r.recipient_count, status: r.status
    })));
});

app.post('/api/newsletters', async (req, res) => {
    const n = req.body;
    
    // Simulate sending Logic
    try {
        const [recipients] = await pool.query('SELECT email, name FROM users WHERE role="customer"');
        console.log(`[Newsletter] Starting bulk send for campaign "${n.subject}"...`);
        console.log(`[Newsletter] Content HTML Preview: ${n.content.substring(0, 50)}...`);
        
        // In a real app, use Nodemailer here.
        // const transporter = nodemailer.createTransport({...});
        
        let sentCount = 0;
        for(const user of recipients) { 
            // await transporter.sendMail({ from: 'noreply@store.com', to: user.email, subject: n.subject, html: n.content });
            console.log(`[Newsletter] Sent to ${user.email}`);
            sentCount++;
        }
        
        await pool.query(
            'INSERT INTO newsletter_campaigns (id, subject, content, sent_date, recipient_count, status) VALUES (?, ?, ?, ?, ?, ?)',
            [n.id, n.subject, n.content, n.sentDate, sentCount, 'Sent']
        );
        res.status(201).json({ message: `Newsletter sent to ${sentCount} recipients.` });
    } catch (e) {
        console.error("Newsletter Error", e);
        res.status(500).json({ error: e.message });
    }
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        for (const order of orders) {
            const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            order.items = items.map(i => ({
                id: i.product_id, 
                name: i.product_name,
                price: i.price,
                quantity: i.quantity,
                image: i.image,
                selectedVariation: i.selected_variation ? JSON.parse(i.selected_variation) : undefined
            }));
            
            order.userId = order.user_id;
            order.customerName = order.customer_name;
            order.customerEmail = order.customer_email;
            order.customerPhone = order.customer_phone;
            order.shippingAddress = order.shipping_address;
            order.shippingCost = order.shipping_cost;
            order.paymentStatus = order.payment_status;
            order.date = new Date(order.created_at).toISOString().split('T')[0];
        }
        res.json(orders);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const o = req.body;
        
        await conn.query(
            'INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, shipping_address, subtotal, shipping_cost, tax, total, status, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [o.id, o.userId, o.customerName, o.customerEmail, o.customerPhone, o.shippingAddress, o.subtotal, o.shippingCost, o.tax, o.total, o.status, o.paymentStatus]
        );

        if (o.items && o.items.length > 0) {
            for (const item of o.items) {
                await conn.query(
                    'INSERT INTO order_items (order_id, product_id, product_name, quantity, price, image, selected_variation) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [o.id, item.id, item.name, item.quantity, item.price, item.image, item.selectedVariation ? JSON.stringify(item.selectedVariation) : null]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Order created', id: o.id });
    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

app.put('/api/orders/:id', async (req, res) => {
    const { status, paymentStatus } = req.body;
    await pool.query('UPDATE orders SET status=?, payment_status=? WHERE id=?', [status, paymentStatus, req.params.id]);
    res.json({ message: 'Order updated' });
});

// --- PROJECTS ---
app.get('/api/projects', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM projects');
    res.json(rows.map(r => ({ id: r.id, title: r.title, description: r.description, coverImage: r.cover_image, client: r.client, date: r.completion_date, images: JSON.parse(r.images || '[]') })));
});

app.post('/api/projects', async (req, res) => {
    const p = req.body;
    const exists = await checkExists('projects', 'id', p.id);
    if (exists) {
         await pool.query('UPDATE projects SET title=?, description=?, cover_image=?, client=?, completion_date=?, images=? WHERE id=?', [p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images), p.id]);
         res.json({message: 'Updated (fallback)'});
    } else {
         await pool.query('INSERT INTO projects (id, title, description, cover_image, client, completion_date, images) VALUES (?,?,?,?,?,?,?)', [p.id, p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images)]);
         res.status(201).json({message: 'Created'});
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const p = req.body;
    await pool.query('UPDATE projects SET title=?, description=?, cover_image=?, client=?, completion_date=?, images=? WHERE id=?', [p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images), req.params.id]);
    res.json({message: 'Updated'});
});

app.delete('/api/projects/:id', async (req, res) => {
    await pool.query('DELETE FROM projects WHERE id=?', [req.params.id]);
    res.json({message: 'Deleted'});
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    for (let product of rows) {
       const [cats] = await pool.query('SELECT category_name FROM product_categories WHERE product_id = ?', [product.id]);
       product.categories = cats.map(c => c.category_name);
       const [imgs] = await pool.query('SELECT image_url FROM product_images WHERE product_id = ?', [product.id]);
       product.images = imgs.map(i => i.image_url);
       const [related] = await pool.query('SELECT related_product_id FROM related_products WHERE product_id = ?', [product.id]);
       product.relatedProducts = related.map(r => r.related_product_id);
       if (product.extra_data) {
           try { Object.assign(product, JSON.parse(product.extra_data)); } catch (e) {}
       }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const p = req.body;
        const adminEmail = req.headers['x-admin-email'];
        if (await checkExists('products', 'id', p.id)) throw new Error(`Product ID ${p.id} already exists.`);
        const extraData = JSON.stringify({ variations: p.variations || [], specifications: p.specifications || [], customTabs: p.customTabs || [], features: p.features || [], weight: p.weight || 0, specificShippingCharges: p.specificShippingCharges || [], rating: p.rating || 5 });
        await conn.query('INSERT INTO products (id, name, price, sale_price, on_sale, description, short_description, model_number, image, is_visible, extra_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [p.id, p.name, p.price, p.salePrice, p.onSale, p.description, p.shortDescription, p.modelNumber, p.image, p.isVisible, extraData]);
        if (p.categories) for (const cat of p.categories) await conn.query('INSERT INTO product_categories VALUES (?, ?)', [p.id, cat]);
        if (p.images) for (const img of p.images) if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [p.id, img]);
        if (p.relatedProducts) for (const relId of p.relatedProducts) await conn.query('INSERT INTO related_products VALUES (?, ?)', [p.id, relId]);
        await logAction(conn, adminEmail, 'CREATE_PRODUCT', p.id, { name: p.name });
        await conn.commit();
        res.status(201).json({ message: 'Product created' });
    } catch (error) { await conn.rollback(); res.status(500).json({ message: error.message }); } finally { conn.release(); }
});

app.put('/api/products/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const p = req.body;
        const id = req.params.id;
        const adminEmail = req.headers['x-admin-email'];
        const extraData = JSON.stringify({ variations: p.variations || [], specifications: p.specifications || [], customTabs: p.customTabs || [], features: p.features || [], weight: p.weight || 0, specificShippingCharges: p.specificShippingCharges || [], rating: p.rating || 5 });
        await conn.query('UPDATE products SET name=?, price=?, sale_price=?, on_sale=?, description=?, short_description=?, model_number=?, image=?, is_visible=?, extra_data=? WHERE id=?', [p.name, p.price, p.salePrice, p.onSale, p.description, p.shortDescription, p.modelNumber, p.image, p.isVisible, extraData, id]);
        await conn.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
        if (p.categories) for (const cat of p.categories) await conn.query('INSERT INTO product_categories VALUES (?, ?)', [id, cat]);
        await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        if (p.images) for (const img of p.images) if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, img]);
        await conn.query('DELETE FROM related_products WHERE product_id = ?', [id]);
        if (p.relatedProducts) for (const relId of p.relatedProducts) await conn.query('INSERT INTO related_products VALUES (?, ?)', [id, relId]);
        await logAction(conn, adminEmail, 'UPDATE_PRODUCT', id, { name: p.name });
        await conn.commit();
        res.json({ message: 'Product updated' });
    } catch (error) { await conn.rollback(); res.status(500).json({ message: error.message }); } finally { conn.release(); }
});

app.delete('/api/products/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const adminEmail = req.headers['x-admin-email'];
        await conn.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        await logAction(conn, adminEmail, 'DELETE_PRODUCT', req.params.id, {});
        res.json({ message: 'Product deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); } finally { conn.release(); }
});

// --- CATEGORIES & USERS ---
app.get('/api/categories', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json(rows.map(r => ({ id: r.id, name: r.name, slug: r.slug, image: r.image, parentId: r.parent_id, isFeatured: Boolean(r.is_featured), order: r.sort_order })));
});

app.post('/api/categories', async (req, res) => {
    const c = req.body;
    await pool.query('INSERT INTO categories (id, name, slug, image, parent_id, is_featured, sort_order) VALUES (?,?,?,?,?,?,?)', [c.id, c.name, c.slug, c.image, c.parentId, c.isFeatured, c.order]);
    res.status(201).json({message: 'Created'});
});

app.put('/api/categories/:id', async (req, res) => {
    const c = req.body;
    await pool.query('UPDATE categories SET name=?, slug=?, image=?, parent_id=?, is_featured=?, sort_order=? WHERE id=?', [c.name, c.slug, c.image, c.parentId, c.isFeatured, c.order, req.params.id]);
    res.json({message: 'Updated'});
});

app.delete('/api/categories/:id', async (req, res) => {
    await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({message: 'Deleted'});
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, role, phone, address, join_date FROM users');
        res.json(rows.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role, phone: r.phone, address: r.address, joinDate: r.join_date })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const u = req.body;
        const adminEmail = req.headers['x-admin-email'];
        if (await checkExists('users', 'email', u.email)) return res.status(409).json({ message: 'Email already exists' });
        await conn.query('INSERT INTO users (id, name, email, password_hash, role, phone, address, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [u.id, u.name, u.email, u.password || '123456', u.role, u.phone, u.address]);
        await logAction(conn, adminEmail, 'CREATE_USER', u.id, { email: u.email });
        res.status(201).json({ message: 'User created' });
    } catch (e) { res.status(500).json({ error: e.message }); } finally { conn.release(); }
});

app.put('/api/users/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const u = req.body;
        const adminEmail = req.headers['x-admin-email'];
        if (await checkExists('users', 'email', u.email, req.params.id)) return res.status(409).json({ message: 'Email taken' });
        if (u.password) await conn.query('UPDATE users SET name=?, email=?, password_hash=?, role=?, phone=?, address=? WHERE id=?', [u.name, u.email, u.password, u.role, u.phone, u.address, req.params.id]);
        else await conn.query('UPDATE users SET name=?, email=?, role=?, phone=?, address=? WHERE id=?', [u.name, u.email, u.role, u.phone, u.address, req.params.id]);
        await logAction(conn, adminEmail, 'UPDATE_USER', req.params.id, { email: u.email });
        res.json({ message: 'User updated' });
    } catch (e) { res.status(500).json({ error: e.message }); } finally { conn.release(); }
});

app.get('/api/config', async (req, res) => {
    const [rows] = await pool.query('SELECT config_data FROM site_config WHERE id = "main-config"');
    if (rows.length > 0 && rows[0].config_data) res.json(JSON.parse(rows[0].config_data));
    else res.json({});
});

app.post('/api/config', async (req, res) => {
    const configData = JSON.stringify(req.body);
    await pool.query('INSERT INTO site_config (id, config_data) VALUES ("main-config", ?) ON DUPLICATE KEY UPDATE config_data=VALUES(config_data)', [configData]);
    res.json({message: 'Config saved'});
});

app.get('/api/pages', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM custom_pages');
    res.json(rows.map(r => ({ id: r.id, slug: r.slug, title: r.title, ...JSON.parse(r.content_json || '{}') })));
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

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            if (user.password_hash === password) {
                 res.json({ id: user.id, name: user.name, email: user.email, role: user.role, joinDate: user.join_date });
                return;
            }
        }
        res.status(401).json({ message: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
