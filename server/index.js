
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const slugify = require('slugify');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve Static Files (Images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const uploadDirs = ['uploads/products', 'uploads/projects', 'uploads/thumbnails'];
uploadDirs.forEach(dir => fs.ensureDirSync(path.join(__dirname, dir)));

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

// Multer Config (Temp storage)
const upload = multer({ dest: 'uploads/temp/' });

// --- ROUTES ---

// --- IMAGE UPLOAD ENDPOINT ---
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { context, name } = req.body; // context: 'product' or 'project', name: product name
        const cleanName = slugify(name || 'untitled', { lower: true, strict: true });
        const targetDir = context === 'project' ? 'uploads/projects' : 'uploads/products';
        const thumbDir = 'uploads/thumbnails';
        
        // Determine file number
        const existingFiles = await fs.readdir(path.join(__dirname, targetDir));
        const matchingFiles = existingFiles.filter(f => f.startsWith(cleanName));
        const nextNum = matchingFiles.length + 1;
        
        const ext = path.extname(req.file.originalname);
        const finalFilename = `${cleanName}_${nextNum}${ext}`;
        const finalPath = path.join(__dirname, targetDir, finalFilename);
        const thumbPath = path.join(__dirname, thumbDir, finalFilename);

        // Process Image: Move original and Create Thumbnail
        await fs.move(req.file.path, finalPath);
        
        // Generate Thumbnail (200px width)
        await sharp(finalPath)
            .resize(200)
            .toFile(thumbPath);

        const serverUrl = `${req.protocol}://${req.get('host')}`;
        
        res.json({
            url: `${serverUrl}/${targetDir}/${finalFilename}`,
            thumbnailUrl: `${serverUrl}/${thumbDir}/${finalFilename}`
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- NEWSLETTER (UPDATED) ---
app.get('/api/newsletters', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM newsletter_campaigns ORDER BY sent_date DESC');
    res.json(rows.map(r => ({
        id: r.id, subject: r.subject, content: r.content, sentDate: r.sent_date, recipientCount: r.recipient_count, status: r.status
    })));
});

app.post('/api/newsletters', async (req, res) => {
    const { id, subject, content, sentDate, type, manualRecipients } = req.body;
    
    try {
        let recipientList = [];
        let count = 0;

        if (type === 'bulk_candidates') {
            // Logic for manual bulk email (e.g., Candidates)
            if (manualRecipients) {
                // Split by comma or newline
                recipientList = manualRecipients.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
            }
            console.log(`[Newsletter - Bulk Candidate] Sending to ${recipientList.length} emails...`);
        } else {
            // Logic for Marketing Campaign (Database Users)
            const [users] = await pool.query('SELECT email FROM users WHERE role="customer"');
            recipientList = users.map(u => u.email);
            console.log(`[Newsletter - Campaign] Sending to ${recipientList.length} registered customers...`);
        }

        // Simulate Sending
        // for(const email of recipientList) { await sendEmail(email, subject, content); }
        count = recipientList.length;

        await pool.query(
            'INSERT INTO newsletter_campaigns (id, subject, content, sent_date, recipient_count, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, subject, content, sentDate, count, 'Sent']
        );
        
        res.status(201).json({ message: `Sent to ${count} recipients successfully` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ... [Rest of the existing endpoints: stats, shipping, orders, projects, products, auth etc. remain the same] ...

// --- DASHBOARD STATS ---
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            totalOrdersMonth: 0,
            totalVisitsMonth: 3420,
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
