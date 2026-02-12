
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

// --- 1. ENSURE UPLOAD DIRECTORIES EXIST (Including 'temp') ---
// Added 'uploads/temp' to prevent Multer errors
const uploadDirs = ['uploads/products', 'uploads/projects', 'uploads/thumbnails', 'uploads/gallery', 'uploads/temp'];
uploadDirs.forEach(dir => fs.ensureDirSync(path.join(__dirname, dir)));

// Serve Static Files (Images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// --- 2. AUTO-INIT DATABASE ---
async function initDB() {
    try {
        const conn = await pool.getConnection();
        
        // Ensure media_library table exists
        await conn.query(`
            CREATE TABLE IF NOT EXISTS media_library (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_name VARCHAR(255),
                file_path TEXT,
                folder VARCHAR(50),
                file_size INT,
                mime_type VARCHAR(50),
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Ensure other tables exist (Simplified check)
        await conn.query(`
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
            )
        `);

        // (You can add other critical tables here if needed to be self-healing)
        
        console.log("✅ Database tables checked/initialized.");
        conn.release();
    } catch (e) {
        console.error("❌ Database Initialization Failed:", e);
    }
}

// Initialize DB on startup
initDB();

// --- HELPERS ---

async function logAction(connection, adminEmail, actionType, targetId, details, changes = null) {
    try {
        const query = 'INSERT INTO audit_logs (admin_email, action_type, target_id, details, changes) VALUES (?, ?, ?, ?, ?)';
        await connection.query(query, [adminEmail || 'system', actionType, targetId, JSON.stringify(details), changes ? JSON.stringify(changes) : null]);
    } catch (e) {
        // console.error("Failed to write audit log (Table might not exist yet):", e.message);
    }
}

function getDiff(oldObj, newObj, ignoredKeys = []) {
    const diff = {};
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    ignoredKeys.push('created_at', 'updated_at', 'extra_data'); 
    
    keys.forEach(key => {
        if (ignoredKeys.includes(key)) return;
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            diff[key] = { from: oldObj[key], to: newObj[key] };
        }
    });
    return diff;
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

// Sync function to ensure all files on disk are in the database
async function syncMediaLibrary() {
    const directories = ['uploads/products', 'uploads/projects', 'uploads/gallery'];
    
    for (const dir of directories) {
        const fullPath = path.join(__dirname, dir);
        if (fs.existsSync(fullPath)) {
            const files = await fs.readdir(fullPath);
            for (const file of files) {
                if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) continue;
                
                const filePath = `${dir}/${file}`;
                // Check if exists in DB
                const [rows] = await pool.query('SELECT id FROM media_library WHERE file_path = ?', [filePath]);
                if (rows.length === 0) {
                    const stats = fs.statSync(path.join(fullPath, file));
                    const mimeType = 'image/' + path.extname(file).substring(1).toLowerCase();
                    await pool.query(
                        'INSERT INTO media_library (file_name, file_path, folder, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
                        [file, filePath, dir.replace('uploads/', ''), stats.size, mimeType]
                    );
                }
            }
        }
    }
}

// Multer Config (Temp storage)
const upload = multer({ dest: 'uploads/temp/' });

// --- ROUTES ---

// --- GLOBAL SEARCH ---
app.get('/api/admin/search', async (req, res) => {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json([]);
    const searchTerm = `%${q}%`;

    try {
        const [products] = await pool.query('SELECT id, name as title, "product" as type, model_number as subtitle FROM products WHERE name LIKE ? OR model_number LIKE ? LIMIT 5', [searchTerm, searchTerm]);
        const [orders] = await pool.query('SELECT id, customer_name as title, "order" as type, CONCAT("Total: ", total) as subtitle FROM orders WHERE id LIKE ? OR customer_name LIKE ? LIMIT 5', [searchTerm, searchTerm]);
        const [users] = await pool.query('SELECT id, name as title, "user" as type, email as subtitle FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 5', [searchTerm, searchTerm]);
        
        // Handle case where custom_pages table might not exist perfectly
        let pages = [];
        try {
             [pages] = await pool.query('SELECT id, title, "page" as type, slug as subtitle FROM custom_pages WHERE title LIKE ? LIMIT 3', [searchTerm]);
        } catch(e) {}

        res.json([...products, ...orders, ...users, ...pages]);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// --- IMAGE GALLERY ENDPOINTS ---

// Get all images (Sync first, then query DB)
app.get('/api/admin/images', async (req, res) => {
    try {
        await syncMediaLibrary();
        const [rows] = await pool.query('SELECT * FROM media_library ORDER BY upload_date DESC');
        
        // CDN Support: Use CDN_URL env var if available, otherwise fallback to local
        const serverUrl = process.env.CDN_URL || `${req.protocol}://${req.get('host')}`;
        
        const images = rows.map(row => ({
            id: row.id,
            name: row.file_name,
            url: `${serverUrl}/${row.file_path}`,
            folder: row.folder,
            size: row.file_size,
            date: row.upload_date
        }));
        
        res.json(images);
    } catch (e) {
        console.error("Gallery Error:", e);
        // Fallback: If DB fails, just list files from folders directly so the UI doesn't crash
        res.status(500).json({ message: "Database sync failed: " + e.message });
    }
});

// Check where an image is used
app.get('/api/admin/image-usage', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.json([]);
    
    const filename = path.basename(url);
    const searchTerm = `%${filename}%`;
    const references = [];

    try {
        const [products] = await pool.query('SELECT id, name FROM products WHERE image LIKE ? OR images LIKE ?', [searchTerm, searchTerm]);
        products.forEach(p => references.push({ type: 'Product', id: p.id, name: p.name }));

        try {
            const [projects] = await pool.query('SELECT id, title FROM projects WHERE cover_image LIKE ? OR images LIKE ?', [searchTerm, searchTerm]);
            projects.forEach(p => references.push({ type: 'Project', id: p.id, name: p.title }));
        } catch(e) {}

        try {
            const [cats] = await pool.query('SELECT id, name FROM categories WHERE image LIKE ?', [searchTerm]);
            cats.forEach(c => references.push({ type: 'Category', id: c.id, name: c.name }));
        } catch(e) {}

        res.json(references);
    } catch (e) {
        // Don't block the UI if usage check fails
        res.json([]); 
    }
});

// --- IMAGE UPLOAD ENDPOINT ---
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { context, name } = req.body; 
        
        let targetDir = 'uploads/gallery';
        let cleanName = '';

        if (context === 'product') {
            targetDir = 'uploads/products';
            cleanName = slugify(name || 'product', { lower: true, strict: true });
        } else if (context === 'project') {
            targetDir = 'uploads/projects';
            cleanName = slugify(name || 'project', { lower: true, strict: true });
        } else {
            // Generic Gallery Upload
            const originalName = path.parse(req.file.originalname).name;
            cleanName = slugify(originalName, { lower: true, strict: true });
        }

        const thumbDir = 'uploads/thumbnails';
        
        // Determine file number/suffix to avoid collision
        const existingFiles = await fs.readdir(path.join(__dirname, targetDir));
        let finalFilename = `${cleanName}${path.extname(req.file.originalname)}`;
        let counter = 1;
        while (existingFiles.includes(finalFilename)) {
            finalFilename = `${cleanName}_${counter}${path.extname(req.file.originalname)}`;
            counter++;
        }
        
        const finalPath = path.join(__dirname, targetDir, finalFilename);
        const relativePath = `${targetDir}/${finalFilename}`;
        const thumbPath = path.join(__dirname, thumbDir, finalFilename);

        // Process Image: Optimize and Move
        if (/\.gif$/i.test(req.file.originalname)) {
            // Skip complex optimization for GIFs to preserve animation simply for now
            await fs.move(req.file.path, finalPath);
        } else {
            try {
                const image = sharp(req.file.path);
                const metadata = await image.metadata();
                
                // Resize if extremely large (>2500px width)
                if (metadata.width > 2500) {
                    image.resize({ width: 2500, withoutEnlargement: true });
                }
                
                // Auto-rotate based on EXIF data
                image.rotate();

                // Compress based on format
                if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                    image.jpeg({ quality: 80, mozjpeg: true });
                } else if (metadata.format === 'png') {
                    image.png({ quality: 80, compressionLevel: 8, palette: true });
                } else if (metadata.format === 'webp') {
                    image.webp({ quality: 80 });
                }
                
                await image.toFile(finalPath);
                await fs.remove(req.file.path); // Remove temp file
            } catch(e) {
                console.error("Image optimization failed, falling back to raw move", e);
                await fs.move(req.file.path, finalPath); 
            }
        }
        
        // Generate Thumbnail (200px width)
        try {
            await sharp(finalPath).resize(200).toFile(thumbPath);
        } catch(err) {
            console.error("Thumbnail generation failed (ignoring)", err.message);
        }

        // Store in Database
        try {
            const stats = await fs.stat(finalPath);
            await pool.query(
                'INSERT INTO media_library (file_name, file_path, folder, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
                [finalFilename, relativePath, targetDir.replace('uploads/', ''), stats.size, req.file.mimetype]
            );
        } catch (dbErr) {
            console.error("DB Insert failed for image (ignoring)", dbErr.message);
        }

        // CDN Support for returned URL
        const serverUrl = process.env.CDN_URL || `${req.protocol}://${req.get('host')}`;
        
        res.json({
            url: `${serverUrl}/${relativePath}`,
            thumbnailUrl: `${serverUrl}/${thumbDir}/${finalFilename}`
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50');
        const logs = rows.map(row => ({
            ...row,
            details: row.details ? JSON.parse(row.details) : {},
            changes: row.changes ? JSON.parse(row.changes) : null
        }));
        res.json(logs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

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

        try {
            const [monthData] = await pool.query(`
                SELECT COUNT(*) as count, SUM(total) as revenue 
                FROM orders 
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())
            `);
            stats.totalOrdersMonth = monthData[0].count || 0;
            stats.revenueMonth = monthData[0].revenue || 0;
        } catch(e) {}

        try {
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
        } catch(e) {}

        try {
            const [recentLogs] = await pool.query(`
                SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10
            `);
            stats.recentActivity = recentLogs.map(l => {
                const admin = l.admin_email.split('@')[0];
                const action = l.action_type.replace(/_/g, ' ').toLowerCase();
                return `${admin} ${action} (ID: ${l.target_id})`;
            });
        } catch(e) {}

        res.json(stats);
    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ message: e.message });
    }
});

// ... [Keep Existing Products/Users/etc. Routes - They are fine if tables exist] ...

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
  } catch (error) { res.status(500).json({ message: error.message }); }
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
        
        await logAction(conn, adminEmail, 'CREATE_PRODUCT', p.id, { name: p.name }, { action: 'Created new product' });
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
        
        const [oldRows] = await conn.query('SELECT * FROM products WHERE id = ?', [id]);
        const oldData = oldRows[0];
        
        const extraData = JSON.stringify({ variations: p.variations || [], specifications: p.specifications || [], customTabs: p.customTabs || [], features: p.features || [], weight: p.weight || 0, specificShippingCharges: p.specificShippingCharges || [], rating: p.rating || 5 });
        await conn.query('UPDATE products SET name=?, price=?, sale_price=?, on_sale=?, description=?, short_description=?, model_number=?, image=?, is_visible=?, extra_data=? WHERE id=?', [p.name, p.price, p.salePrice, p.onSale, p.description, p.shortDescription, p.modelNumber, p.image, p.isVisible, extraData, id]);
        
        await conn.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
        if (p.categories) for (const cat of p.categories) await conn.query('INSERT INTO product_categories VALUES (?, ?)', [id, cat]);
        await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        if (p.images) for (const img of p.images) if(img) await conn.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, img]);
        await conn.query('DELETE FROM related_products WHERE product_id = ?', [id]);
        if (p.relatedProducts) for (const relId of p.relatedProducts) await conn.query('INSERT INTO related_products VALUES (?, ?)', [id, relId]);
        
        const changes = getDiff(oldData || {}, { ...p, extra_data: extraData });
        await logAction(conn, adminEmail, 'UPDATE_PRODUCT', id, { name: p.name }, changes);
        
        await conn.commit();
        res.json({ message: 'Product updated' });
    } catch (error) { await conn.rollback(); res.status(500).json({ message: error.message }); } finally { conn.release(); }
});

app.delete('/api/products/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const adminEmail = req.headers['x-admin-email'];
        await conn.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        await logAction(conn, adminEmail, 'DELETE_PRODUCT', req.params.id, {}, { action: 'Deleted product' });
        res.json({ message: 'Product deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); } finally { conn.release(); }
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, role, phone, address, join_date FROM users');
        res.json(rows.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role, phone: r.phone, address: r.address, joinDate: r.join_date })));
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/users', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const u = req.body;
        const adminEmail = req.headers['x-admin-email'];
        if (await checkExists('users', 'email', u.email)) return res.status(409).json({ message: 'Email already exists' });
        await conn.query('INSERT INTO users (id, name, email, password_hash, role, phone, address, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [u.id, u.name, u.email, u.password || '123456', u.role, u.phone, u.address]);
        await logAction(conn, adminEmail, 'CREATE_USER', u.id, { email: u.email }, { role: { from: null, to: u.role }});
        res.status(201).json({ message: 'User created' });
    } catch (e) { res.status(500).json({ message: e.message }); } finally { conn.release(); }
});

app.put('/api/users/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const u = req.body;
        const adminEmail = req.headers['x-admin-email'];
        const [oldRows] = await conn.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        const oldData = oldRows[0];
        if (await checkExists('users', 'email', u.email, req.params.id)) return res.status(409).json({ message: 'Email taken' });
        let query, params;
        if (u.password) {
            query = 'UPDATE users SET name=?, email=?, password_hash=?, role=?, phone=?, address=? WHERE id=?';
            params = [u.name, u.email, u.password, u.role, u.phone, u.address, req.params.id];
        } else {
            query = 'UPDATE users SET name=?, email=?, role=?, phone=?, address=? WHERE id=?';
            params = [u.name, u.email, u.role, u.phone, u.address, req.params.id];
        }
        await conn.query(query, params);
        const changes = getDiff(oldData, u, ['password_hash']);
        await logAction(conn, adminEmail, 'UPDATE_USER', req.params.id, { email: u.email }, changes);
        res.json({ message: 'User updated' });
    } catch (e) { res.status(500).json({ message: e.message }); } finally { conn.release(); }
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
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM projects');
        res.json(rows.map(r => ({ id: r.id, title: r.title, description: r.description, coverImage: r.cover_image, client: r.client, date: r.completion_date, images: JSON.parse(r.images || '[]') })));
    } catch(e) { res.json([]); }
});

app.post('/api/projects', async (req, res) => {
    const p = req.body;
    try {
        const exists = await checkExists('projects', 'id', p.id);
        if (exists) {
             await pool.query('UPDATE projects SET title=?, description=?, cover_image=?, client=?, completion_date=?, images=? WHERE id=?', [p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images), p.id]);
             res.json({message: 'Updated (fallback)'});
        } else {
             await pool.query('INSERT INTO projects (id, title, description, cover_image, client, completion_date, images) VALUES (?,?,?,?,?,?,?)', [p.id, p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images)]);
             res.status(201).json({message: 'Created'});
        }
    } catch(e) { res.status(500).json({message: e.message}); }
});

app.put('/api/projects/:id', async (req, res) => {
    const p = req.body;
    try {
        await pool.query('UPDATE projects SET title=?, description=?, cover_image=?, client=?, completion_date=?, images=? WHERE id=?', [p.title, p.description, p.coverImage, p.client, p.date, JSON.stringify(p.images), req.params.id]);
        res.json({message: 'Updated'});
    } catch(e) { res.status(500).json({message: e.message}); }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id=?', [req.params.id]);
        res.json({message: 'Deleted'});
    } catch(e) { res.status(500).json({message: e.message}); }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
