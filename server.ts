import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb, resetDatabase, initializeDatabase } from './server/db.ts';
import { calculateDemandForecasts, getProductSalesHistory } from './server/forecast.ts';
import { processAiQuery, generateAutomatedRecommendations, aiTools } from './server/ai.ts';
import type {
  User,
  Product,
  Sale,
  SaleItem,
  InventoryTransaction,
  PurchaseOrder,
  PurchaseOrderItem,
  Expense,
  Alert,
} from './src/types/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'sme-intelligence-jwt-secret-key-2026');
if (!JWT_SECRET) { throw new Error('JWT_SECRET must be configured in production.'); }

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bizmind-api', persistence: process.env.DATABASE_URL ? 'postgresql' : 'local-json' });
});

// Initialize persistence before accepting requests. PostgreSQL is used when DATABASE_URL is configured;
// local/demo environments retain the JSON seed fallback.
await initializeDatabase();
getDb();

// JWT Helper
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  businessId: string;
}

function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded as JwtPayload;
    next();
  });
}

function requireRole(...roles: Array<'owner' | 'manager'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as 'owner' | 'manager')) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & PROFILE ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const {
    email,
    password,
    name,
    role = 'owner',
    phone,
    avatar,
    job_title,
    business_name,
    industry,
    currency = '৳',
    location,
    bin_number,
    trade_license,
  } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const db = getDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  // Every new owner gets a separate tenant. Managers are not allowed to self-create a tenant.
  if (role !== 'owner') {
    return res.status(400).json({ error: 'New registrations must use the owner role. Managers must be created/invited by an existing business owner.' });
  }

  const businessId = `biz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.businesses.push({
    id: businessId,
    name: business_name || `${name}'s Business`,
    industry: industry || 'Retail & Distribution',
    currency: currency || '৳',
    location: location || 'Bangladesh',
    bin_number: bin_number || '',
    trade_license: trade_license || '',
    created_at: new Date().toISOString(),
  });

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const newUser: User = {
    id: `usr-${Date.now()}`,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    name,
    role: role === 'owner' ? 'owner' : 'manager',
    phone: phone || '',
    avatar: avatar || 'bg-blue-600',
    job_title: job_title || (role === 'owner' ? 'Managing Director & Founder' : 'Operations Manager'),
    business_id: businessId,
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);

  const token = generateToken(newUser);
  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      avatar: newUser.avatar,
      job_title: newUser.job_title,
      business_id: newUser.business_id,
      business: db.businesses.find(b => b.id === newUser.business_id),
    },
    token,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      job_title: user.job_title,
      business_id: user.business_id,
      business: db.businesses.find(b => b.id === user.business_id),
    },
    token,
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    job_title: user.job_title,
    business_id: user.business_id,
    business: db.businesses.find(b => b.id === user.business_id),
  });
});

// Update User Profile
app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, phone, avatar, job_title, password } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar) user.avatar = avatar;
  if (job_title) user.job_title = job_title;
  if (password && password.length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    user.password_hash = bcrypt.hashSync(password, salt);
  }

  saveDb(db);

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      job_title: user.job_title,
      business_id: user.business_id,
      business: db.businesses.find(b => b.id === user.business_id),
    },
  });
});

// Business Profile Endpoints
app.get('/api/business/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const business = db.businesses.find(b => b.id === req.user?.businessId);
  if (!business) {
    return res.status(404).json({ error: 'Business profile not found' });
  }
  res.json(business);
});

app.put('/api/business/profile', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  let business = db.businesses.find(b => b.id === req.user?.businessId);
  if (!business) {
    return res.status(404).json({ error: 'Business profile not found' });
  }

  const { name, industry, currency, location, bin_number, trade_license, phone, email } = req.body;
  if (name) business.name = name;
  if (industry) business.industry = industry;
  if (currency) business.currency = currency;
  if (location !== undefined) business.location = location;
  if (bin_number !== undefined) business.bin_number = bin_number;
  if (trade_license !== undefined) business.trade_license = trade_license;
  if (phone !== undefined) business.phone = phone;
  if (email !== undefined) business.email = email;

  saveDb(db);
  res.json({ message: 'Business profile updated successfully', business });
});

// -------------------------------------------------------------
// 2. PRODUCTS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/products', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { search, category, low_stock } = req.query;

  let filtered = db.products.filter(p => p.is_active && p.business_id === req.user?.businessId);

  if (category && typeof category === 'string') {
    filtered = filtered.filter(p => p.category_id === category);
  }

  if (low_stock === 'true') {
    filtered = filtered.filter(p => p.current_stock <= p.min_stock);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }

  // Enrich with category name and supplier name
  const enriched = filtered.map(p => {
    const cat = db.categories.find(c => c.id === p.category_id);
    const sup = db.suppliers.find(s => s.id === p.supplier_id);
    return {
      ...p,
      category_name: cat?.name || 'Uncategorized',
      supplier_name: sup?.name || 'Unknown',
      is_low_stock: p.current_stock <= p.min_stock,
    };
  });

  res.json(enriched);
});

app.post('/api/products', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, category_id, purchase_price, selling_price, current_stock, min_stock, supplier_id } = req.body;
  if (!name || !sku || !purchase_price || !selling_price) {
    return res.status(400).json({ error: 'Name, SKU, purchase price, and selling price are required' });
  }

  const db = getDb();
  const id = `prod-${Date.now()}`;
  const purchasePrice = Number(purchase_price);
  const sellingPrice = Number(selling_price);
  const stock = Number(current_stock ?? 0);
  const minStk = Number(min_stock ?? 10);
  if (![purchasePrice, sellingPrice, stock, minStk].every(Number.isFinite) || purchasePrice < 0 || sellingPrice < 0 || stock < 0 || minStk < 0) {
    return res.status(400).json({ error: 'Price and stock values must be finite non-negative numbers' });
  }

  const newProduct: Product = {
    id,
    business_id: req.user?.businessId || 'biz-001',
    category_id: category_id || db.categories[0]?.id || 'cat-001',
    name,
    sku: sku.toUpperCase(),
    purchase_price: purchasePrice,
    selling_price: sellingPrice,
    current_stock: stock,
    min_stock: minStk,
    supplier_id: supplier_id || db.suppliers[0]?.id || 'sup-001',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.products.push(newProduct);
  db.inventory.push({
    id: `inv-${Date.now()}`,
    product_id: id,
    current_stock: stock,
    min_stock: minStk,
    last_updated: new Date().toISOString(),
  });

  // Log initial inventory transaction if stock > 0
  if (stock > 0) {
    db.inventory_transactions.push({
      id: `tx-${Date.now()}`,
      business_id: req.user?.businessId || 'biz-001',
      product_id: id,
      type: 'stock_in',
      quantity: stock,
      previous_stock: 0,
      new_stock: stock,
      reason: 'Initial stock intake upon product registration',
      created_at: new Date().toISOString(),
    });
  }

  saveDb(db);
  res.status(201).json(newProduct);
});

app.get('/api/products/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const product = db.products.find(p => p.id === req.params.id && p.business_id === req.user?.businessId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const cat = db.categories.find(c => c.id === product.category_id);
  const sup = db.suppliers.find(s => s.id === product.supplier_id);
  const history = getProductSalesHistory(product.id, req.user?.businessId);
  const requestedDays = Number(req.query.days);
  const forecastDays = [7, 14, 30].includes(requestedDays) ? requestedDays : 14;
  const forecasts = calculateDemandForecasts(req.user?.businessId, forecastDays);
  const forecast = forecasts.find(f => f.product_id === product.id);

  res.json({
    ...product,
    category_name: cat?.name || 'Uncategorized',
    supplier_name: sup?.name || 'Unknown',
    is_low_stock: product.current_stock <= product.min_stock,
    sales_history: history,
    forecast,
  });
});

app.put('/api/products/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const productIndex = db.products.findIndex(p => p.id === req.params.id && p.business_id === req.user?.businessId);
  if (productIndex === -1) return res.status(404).json({ error: 'Product not found' });

  const existing = db.products[productIndex];
  if (existing.business_id !== req.user?.businessId) return res.status(403).json({ error: 'Forbidden' });
  const { name, sku, category_id, purchase_price, selling_price, current_stock, min_stock, supplier_id } = req.body;

  const updated: Product = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    sku: sku !== undefined ? sku.toUpperCase() : existing.sku,
    category_id: category_id !== undefined ? category_id : existing.category_id,
    purchase_price: purchase_price !== undefined ? Number(purchase_price) : existing.purchase_price,
    selling_price: selling_price !== undefined ? Number(selling_price) : existing.selling_price,
    current_stock: existing.current_stock,
    min_stock: min_stock !== undefined ? Number(min_stock) : existing.min_stock,
    supplier_id: supplier_id !== undefined ? supplier_id : existing.supplier_id,
  };

  db.products[productIndex] = updated;

  // Stock changes must go through /api/inventory/adjust so every movement has an audit transaction.
  const inv = db.inventory.find(i => i.product_id === updated.id);
  if (inv) {
    inv.min_stock = updated.min_stock;
    inv.last_updated = new Date().toISOString();
  }

  saveDb(db);
  res.json(updated);
});

app.delete('/api/products/:id', authenticateToken, requireRole('owner', 'manager'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const product = db.products.find(p => p.id === req.params.id && p.business_id === req.user?.businessId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  product.is_active = false; // soft deactivate
  saveDb(db);
  res.json({ message: 'Product deactivated successfully' });
});

// -------------------------------------------------------------
// 3. INVENTORY ENDPOINTS
// -------------------------------------------------------------
app.get('/api/inventory', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const forecasts = calculateDemandForecasts(req.user?.businessId);

  const inventoryView = db.products
    .filter(p => p.is_active)
    .map(p => {
      const sup = db.suppliers.find(s => s.id === p.supplier_id);
      const cat = db.categories.find(c => c.id === p.category_id);
      const fc = forecasts.find(f => f.product_id === p.id);
      return {
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        category: cat?.name || 'General',
        supplier: sup?.name || 'Unknown',
        current_stock: p.current_stock,
        min_stock: p.min_stock,
        purchase_price: p.purchase_price,
        inventory_value: Number((p.current_stock * p.purchase_price).toFixed(2)),
        is_low_stock: p.current_stock <= p.min_stock,
        stockout_risk: fc?.stockout_risk || 'low',
        estimated_stockout_days: fc?.estimated_stockout_days || 99,
        avg_daily_sales: fc?.avg_daily_sales || 0,
      };
    });

  // Recent transactions
  const recentTransactions = db.inventory_transactions.slice(-25).reverse().map(tx => {
    const prod = db.products.find(p => p.id === tx.product_id);
    return {
      ...tx,
      product_name: prod?.name || 'Item',
      product_sku: prod?.sku || '',
    };
  });

  res.json({
    summary: {
      total_items: inventoryView.length,
      total_units: inventoryView.reduce((sum, item) => sum + item.current_stock, 0),
      total_value: Number(inventoryView.reduce((sum, item) => sum + item.inventory_value, 0).toFixed(2)),
      low_stock_count: inventoryView.filter(item => item.is_low_stock).length,
    },
    items: inventoryView,
    transactions: recentTransactions,
  });
});

app.post('/api/inventory/adjust', authenticateToken, requireRole('owner', 'manager'), (req: AuthenticatedRequest, res: Response) => {
  const { product_id, type, quantity, reason } = req.body;
  if (!product_id || !type || quantity === undefined) {
    return res.status(400).json({ error: 'Product ID, type, and quantity are required' });
  }

  const db = getDb();
  const product = db.products.find(p => p.id === product_id && p.business_id === req.user?.businessId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Quantity must be a positive finite number' });
  const prevStock = product.current_stock;
  let newStock = prevStock;

  if (type === 'stock_in') {
    newStock = prevStock + Math.abs(qty);
  } else if (type === 'stock_out') {
    newStock = Math.max(0, prevStock - Math.abs(qty));
  } else if (type === 'adjustment') {
    newStock = Math.max(0, qty);
  } else {
    return res.status(400).json({ error: 'Invalid adjustment type' });
  }

  product.current_stock = newStock;

  // Update inventory record
  const inv = db.inventory.find(i => i.product_id === product.id);
  if (inv) {
    inv.current_stock = newStock;
    inv.last_updated = new Date().toISOString();
  }

  // Create transaction record
  const transaction: InventoryTransaction = {
    id: `tx-${Date.now()}`,
    business_id: req.user?.businessId || 'biz-001',
    product_id: product.id,
    type,
    quantity: newStock - prevStock,
    previous_stock: prevStock,
    new_stock: newStock,
    reason: reason || `Manual inventory ${type}`,
    created_at: new Date().toISOString(),
  };

  db.inventory_transactions.push(transaction);

  // Check low stock trigger
  if (newStock <= product.min_stock) {
    const alertExists = db.alerts.some(a => a.related_id === product.id && !a.is_resolved);
    if (!alertExists) {
      db.alerts.unshift({
        id: `alt-${Date.now()}`,
        business_id: product.business_id,
        type: 'low_stock',
        severity: newStock < product.min_stock / 2 ? 'critical' : 'warning',
        title: `Low Stock: ${product.name}`,
        message: `${product.name} is down to ${newStock} units (minimum: ${product.min_stock}).`,
        related_id: product.id,
        is_read: false,
        is_resolved: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  saveDb(db);
  res.json({
    message: 'Inventory adjusted successfully',
    product: {
      id: product.id,
      name: product.name,
      previous_stock: prevStock,
      current_stock: newStock,
      is_low_stock: newStock <= product.min_stock,
    },
    transaction,
  });
});

app.get('/api/inventory/alerts', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const lowStock = db.products
    .filter(p => p.is_active && p.current_stock <= p.min_stock)
    .map(p => {
      const sup = db.suppliers.find(s => s.id === p.supplier_id);
      return {
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        current_stock: p.current_stock,
        min_stock: p.min_stock,
        supplier: sup?.name || 'Unknown',
        deficit: p.min_stock - p.current_stock,
      };
    });

  res.json({
    count: lowStock.length,
    alerts: lowStock,
  });
});

// -------------------------------------------------------------
// 4. SALES ENDPOINTS
// Essential Workflow Requirement:
// 1. Create sale record
// 2. Create sale items
// 3. Reduce inventory
// 4. Create inventory transaction
// 5. Recalculate metrics
// 6. Trigger low-stock detection
// -------------------------------------------------------------
app.get('/api/sales', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { start_date, end_date, search, limit = '50', page = '1' } = req.query;

  let filtered = db.sales.filter(s => s.business_id === req.user?.businessId);

  if (start_date && typeof start_date === 'string') {
    filtered = filtered.filter(s => s.created_at >= start_date);
  }
  if (end_date && typeof end_date === 'string') {
    filtered = filtered.filter(s => s.created_at <= end_date);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(s => s.customer_name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }

  // Sort latest first
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 50;
  const total = filtered.length;
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    total,
    page: pageNum,
    limit: limitNum,
    sales: paginated,
  });
});

app.post('/api/sales', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { customer_name, customer_id, items, payment_method = 'Cash', notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one sale item is required' });
  }

  const db = getDb();
  const businessId = req.user?.businessId || 'biz-001';
  const saleId = `sale-${Date.now()}`;
  const saleTimestamp = new Date().toISOString();

  let saleTotalAmount = 0;
  let saleTotalCost = 0;
  const createdItems: SaleItem[] = [];
  const lowStockTriggers: Product[] = [];

  // Verify stock & calculate
  for (const item of items) {
    const product = db.products.find(p => p.id === item.product_id && p.business_id === businessId);
    if (!product) {
      return res.status(400).json({ error: `Product ID ${item.product_id} not found` });
    }

    const qty = Number(item.quantity);
    if (qty <= 0) {
      return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
    }

    if (product.current_stock < qty) {
      return res.status(400).json({
        error: `Insufficient stock for ${product.name}. Available: ${product.current_stock}, Requested: ${qty}`,
      });
    }

    const unitPrice = item.unit_price !== undefined ? Number(item.unit_price) : product.selling_price;
    const unitCost = product.purchase_price;
    const subtotal = Number((qty * unitPrice).toFixed(2));
    const costSubtotal = Number((qty * unitCost).toFixed(2));

    saleTotalAmount += subtotal;
    saleTotalCost += costSubtotal;

    // 2. Create sale item
    const saleItem: SaleItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sale_id: saleId,
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price: unitPrice,
      unit_cost: unitCost,
      subtotal,
    };
    createdItems.push(saleItem);

    // 3. Reduce inventory
    const prevStock = product.current_stock;
    const newStock = prevStock - qty;
    product.current_stock = newStock;

    const inv = db.inventory.find(i => i.product_id === product.id);
    if (inv) {
      inv.current_stock = newStock;
      inv.last_updated = saleTimestamp;
    }

    // 4. Create inventory transaction
    db.inventory_transactions.push({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      business_id: businessId,
      product_id: product.id,
      type: 'sale',
      quantity: -qty,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: `Direct sale to ${customer_name || 'Walk-in Customer'}`,
      reference_id: saleId,
      created_at: saleTimestamp,
    });

    // 6. Trigger low-stock detection
    if (newStock <= product.min_stock) {
      lowStockTriggers.push(product);
      const existingAlert = db.alerts.find(a => a.related_id === product.id && !a.is_resolved);
      if (!existingAlert) {
        db.alerts.unshift({
          id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          business_id: businessId,
          type: 'low_stock',
          severity: newStock <= product.min_stock / 2 ? 'critical' : 'warning',
          title: `Low Stock: ${product.name}`,
          message: `${product.name} is down to ${newStock} units following sale #${saleId.slice(-4)} (Minimum stock threshold: ${product.min_stock}).`,
          related_id: product.id,
          is_read: false,
          is_resolved: false,
          created_at: saleTimestamp,
        });
      }
    }
  }

  // 1. Create sale record
  const newSale: Sale = {
    id: saleId,
    business_id: businessId,
    customer_id,
    customer_name: customer_name || 'Walk-in Customer',
    total_amount: Number(saleTotalAmount.toFixed(2)),
    total_cost: Number(saleTotalCost.toFixed(2)),
    payment_method,
    notes: notes || undefined,
    created_at: saleTimestamp,
  };

  db.sales.push(newSale);
  db.sale_items.push(...createdItems);

  // Update customer spend if customer_id provided
  if (customer_id) {
    const cust = db.customers.find(c => c.id === customer_id && c.business_id === businessId);
    if (cust) {
      cust.total_spent = Number((cust.total_spent + newSale.total_amount).toFixed(2));
    }
  }

  saveDb(db);

  res.status(201).json({
    message: 'Sale recorded and inventory reduced successfully',
    sale: newSale,
    items: createdItems,
    low_stock_alerts_triggered: lowStockTriggers.map(p => ({
      product: p.name,
      remaining_stock: p.current_stock,
      min_stock: p.min_stock,
    })),
  });
});

app.get('/api/sales/summary', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const summary = aiTools.get_sales_summary(req.user?.businessId);
  res.json(summary);
});

app.get('/api/sales/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const sale = db.sales.find(s => s.id === req.params.id && s.business_id === req.user?.businessId);
  if (!sale) return res.status(404).json({ error: 'Sale record not found' });

  const items = db.sale_items.filter(i => i.sale_id === sale.id);
  res.json({
    ...sale,
    items,
  });
});

// -------------------------------------------------------------
// 5. SUPPLIERS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/suppliers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const suppliersWithProducts = db.suppliers.filter(s => s.business_id === req.user?.businessId).map(s => {
    const prods = db.products.filter(p => p.supplier_id === s.id);
    return {
      ...s,
      products_count: prods.length,
      products_sample: prods.slice(0, 3).map(p => p.name),
    };
  });
  res.json(suppliersWithProducts);
});

app.post('/api/suppliers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, contact, email, location, delivery_time, reliability } = req.body;
  if (!name || !contact) {
    return res.status(400).json({ error: 'Supplier name and contact are required' });
  }

  const db = getDb();
  const newSupplier = {
    id: `sup-${Date.now()}`,
    business_id: req.user?.businessId || 'biz-001',
    name,
    contact,
    email: email || `orders@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    location: location || 'Commercial Logistics Zone',
    delivery_time: delivery_time || '2-3 business days',
    reliability: Number(reliability) || 90,
    created_at: new Date().toISOString(),
  };

  db.suppliers.push(newSupplier);
  saveDb(db);
  res.status(201).json(newSupplier);
});

app.get('/api/suppliers/compare', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const comparison = aiTools.get_supplier_prices(req.user?.businessId);
  res.json(comparison);
});

app.get('/api/suppliers/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const supplier = db.suppliers.find(s => s.id === req.params.id && s.business_id === req.user?.businessId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

  const products = db.products.filter(p => p.supplier_id === supplier.id);
  const purchaseOrders = db.purchase_orders.filter(po => po.supplier_id === supplier.id);

  res.json({
    ...supplier,
    products,
    purchase_orders: purchaseOrders,
  });
});

// -------------------------------------------------------------
// 6. PROCUREMENT / PURCHASE ORDERS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/purchase-orders', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const orders = db.purchase_orders.filter(po => po.business_id === req.user?.businessId).map(po => {
    const items = db.purchase_order_items.filter(i => i.purchase_order_id === po.id);
    return {
      ...po,
      item_count: items.length,
      items,
    };
  });
  // latest first
  orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(orders);
});

app.post('/api/purchase-orders', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { supplier_id, items, notes, status = 'draft' } = req.body;
  if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Supplier ID and items are required' });
  }

  const db = getDb();
  const supplier = db.suppliers.find(s => s.id === supplier_id && s.business_id === req.user?.businessId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

  const poId = `po-${Date.now()}`;
  let totalCost = 0;
  const createdItems: PurchaseOrderItem[] = [];

  for (const it of items) {
    const product = db.products.find(p => p.id === it.product_id && p.business_id === req.user?.businessId);
    const unitPrice = Number(it.unit_price !== undefined ? it.unit_price : product?.purchase_price || 0);
    const qty = Number(it.quantity) || 1;
    const subtotal = Number((unitPrice * qty).toFixed(2));
    totalCost += subtotal;

    createdItems.push({
      id: `poi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      purchase_order_id: poId,
      product_id: it.product_id,
      product_name: product?.name || it.product_name || 'Supplied Item',
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    });
  }

  const newPO: PurchaseOrder = {
    id: poId,
    business_id: req.user?.businessId || 'biz-001',
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    status: status as any,
    total_estimated_cost: Number(totalCost.toFixed(2)),
    notes: notes || undefined,
    created_at: new Date().toISOString(),
  };

  db.purchase_orders.unshift(newPO);
  db.purchase_order_items.push(...createdItems);

  saveDb(db);
  res.status(201).json({
    ...newPO,
    items: createdItems,
  });
});

app.get('/api/purchase-orders/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const po = db.purchase_orders.find(p => p.id === req.params.id && p.business_id === req.user?.businessId);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });

  const items = db.purchase_order_items.filter(i => i.purchase_order_id === po.id);
  res.json({
    ...po,
    items,
  });
});

app.post('/api/purchase-orders/:id/approve', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const po = db.purchase_orders.find(p => p.id === req.params.id && p.business_id === req.user?.businessId);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });

  po.status = 'approved';
  po.approved_at = new Date().toISOString();

  saveDb(db);
  res.json({ message: 'Purchase order approved successfully', purchase_order: po });
});

app.put('/api/purchase-orders/:id/status', authenticateToken, requireRole('owner', 'manager'), (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['draft', 'pending_approval', 'approved', 'ordered', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const db = getDb();
  const po = db.purchase_orders.find(p => p.id === req.params.id && p.business_id === req.user?.businessId);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });

  const oldStatus = po.status;
  if (oldStatus === 'delivered' && status !== 'delivered') {
    return res.status(400).json({ error: 'A delivered purchase order cannot be moved back to another status.' });
  }
  po.status = status;

  if (status === 'approved' && !po.approved_at) {
    po.approved_at = new Date().toISOString();
  }

  // When delivered: automatically replenish inventory!
  if (status === 'delivered' && oldStatus !== 'delivered') {
    po.delivered_at = new Date().toISOString();
    const poItems = db.purchase_order_items.filter(i => i.purchase_order_id === po.id);

    poItems.forEach(item => {
      const prod = db.products.find(p => p.id === item.product_id);
      if (prod) {
        const prev = prod.current_stock;
        prod.current_stock = prev + item.quantity;
        const inv = db.inventory.find(i => i.product_id === prod.id);
        if (inv) {
          inv.current_stock = prod.current_stock;
          inv.last_updated = new Date().toISOString();
        }

        db.inventory_transactions.push({
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          business_id: po.business_id,
          product_id: prod.id,
          type: 'purchase',
          quantity: item.quantity,
          previous_stock: prev,
          new_stock: prod.current_stock,
          reason: `Goods receipt from PO #${po.id}`,
          reference_id: po.id,
          created_at: new Date().toISOString(),
        });
      }
    });
  }

  saveDb(db);
  res.json({ message: 'Purchase order status updated', purchase_order: po });
});

// -------------------------------------------------------------
// 7. EXPENSES ENDPOINTS
// -------------------------------------------------------------
app.get('/api/expenses', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const { category, month } = req.query;

  let filtered = db.expenses.filter(e => e.business_id === req.user?.businessId);
  if (category && typeof category === 'string') {
    filtered = filtered.filter(e => e.category === category);
  }
  if (month && typeof month === 'string') {
    filtered = filtered.filter(e => e.date.startsWith(month));
  }

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const summary = aiTools.get_expense_summary(req.user?.businessId);
  res.json({
    summary,
    expenses: filtered,
  });
});

app.post('/api/expenses', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { category, amount, date, description } = req.body;
  const validCategories = ['Rent', 'Salary', 'Electricity', 'Transportation', 'Marketing', 'Maintenance', 'Other'];

  if (!category || !validCategories.includes(category) || !amount || !date) {
    return res.status(400).json({ error: 'Valid category, amount, and date are required' });
  }

  const db = getDb();
  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    business_id: req.user?.businessId || 'biz-001',
    category,
    amount: Number(amount),
    date,
    description: description || `${category} business operating expense`,
    created_at: new Date().toISOString(),
  };

  db.expenses.unshift(newExpense);
  saveDb(db);
  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const exp = db.expenses.find(e => e.id === req.params.id && e.business_id === req.user?.businessId);
  if (!exp) return res.status(404).json({ error: 'Expense not found' });

  const { category, amount, date, description } = req.body;
  if (category) exp.category = category;
  if (amount !== undefined) exp.amount = Number(amount);
  if (date) exp.date = date;
  if (description !== undefined) exp.description = description;

  saveDb(db);
  res.json(exp);
});

app.delete('/api/expenses/:id', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const idx = db.expenses.findIndex(e => e.id === req.params.id && e.business_id === req.user?.businessId);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

  db.expenses.splice(idx, 1);
  saveDb(db);
  res.json({ message: 'Expense deleted successfully' });
});

// -------------------------------------------------------------
// 8. ANALYTICS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/analytics/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();

  // Metrics
  let totalRevenue = 0;
  let totalCost = 0;
  let totalExpenses = 0;

  const businessId = req.user?.businessId;
  const businessSales = db.sales.filter(s => s.business_id === businessId);
  const businessExpenses = db.expenses.filter(e => e.business_id === businessId);
  const businessProducts = db.products.filter(p => p.business_id === businessId);
  db.sales.filter(s => s.business_id === businessId).forEach(s => {
    totalRevenue += s.total_amount;
    totalCost += s.total_cost;
  });

  businessExpenses.forEach(e => {
    totalExpenses += e.amount;
  });

  // Estimated Profit = Revenue - Product Cost - Expenses
  const estimatedProfit = Number((totalRevenue - totalCost - totalExpenses).toFixed(2));

  // Inventory stats
  let inventoryValue = 0;
  let lowStockCount = 0;
  businessProducts.forEach(p => {
    if (p.is_active) {
      inventoryValue += p.current_stock * p.purchase_price;
      if (p.current_stock <= p.min_stock) {
        lowStockCount++;
      }
    }
  });

  // Monthly Sales & Expenses chart data
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
  const monthKeys = new Set<string>();
  [...db.sales.filter(s => s.business_id === req.user?.businessId).map(s => s.created_at.slice(0, 7)), ...db.expenses.filter(e => e.business_id === req.user?.businessId).map(e => e.date.slice(0, 7))].forEach(m => monthKeys.add(m));
  const currentMonth = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
    monthKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const months = [...monthKeys].sort().slice(-6);
  const monthNames: Record<string, string> = {};
  months.forEach(m => monthNames[m] = monthFormatter.format(new Date(`${m}-01T00:00:00`))); 

  const monthlyChartData = months.map(m => {
    const mSales = db.sales.filter(s => s.business_id === req.user?.businessId && s.created_at.startsWith(m));
    const mExpenses = db.expenses.filter(e => e.business_id === req.user?.businessId && e.date.startsWith(m));

    const revenue = mSales.reduce((sum, s) => sum + s.total_amount, 0);
    const cogs = mSales.reduce((sum, s) => sum + s.total_cost, 0);
    const expenses = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - cogs - expenses;

    return {
      month: monthNames[m] || m,
      monthKey: m,
      revenue: Number(revenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      expenses: Number(expenses.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      transactions: mSales.length,
    };
  });

  // Top-selling products
  const topProducts = aiTools.get_top_products(businessId);

  // Active Alerts
  const activeAlerts = db.alerts.filter(a => a.business_id === businessId && !a.is_resolved).slice(0, 4);

  // Data-driven dashboard insights. These are regenerated from the current tenant's data.
  const dashboardForecasts = calculateDemandForecasts(businessId);
  const urgent = dashboardForecasts.filter(f => f.stockout_risk === 'critical' || f.stockout_risk === 'high').slice(0, 3);
  const insights = urgent.map((f, index) => ({
    id: `ins-stock-${f.product_id}`,
    type: f.stockout_risk === 'critical' ? 'critical' : 'warning',
    title: `${f.product_name} Stockout Risk`,
    message: `${f.current_stock} units remaining; average demand ${f.avg_daily_sales} units/day; estimated stockout in ~${f.estimated_stockout_days} days. Recommended reorder: ${f.recommended_reorder_qty} units.`,
    action: 'Review Reorder',
    route: '/recommendations',
  }));
  if (insights.length === 0) {
    insights.push({
      id: 'ins-stock-ok',
      type: 'positive',
      title: 'Inventory Position Stable',
      message: 'No products are currently classified as high or critical stockout risk by the demand forecast.',
      action: 'View Inventory',
      route: '/inventory',
    });
  }


  res.json({
    kpis: {
      total_sales_count: db.sales.filter(s => s.business_id === req.user?.businessId).length,
      revenue: Number(totalRevenue.toFixed(2)),
      cogs: Number(totalCost.toFixed(2)),
      expenses: Number(totalExpenses.toFixed(2)),
      estimated_profit: estimatedProfit,
      inventory_value: Number(inventoryValue.toFixed(2)),
      low_stock_count: lowStockCount,
      active_alerts_count: activeAlerts.length,
      currency: db.businesses.find(b => b.id === req.user?.businessId)?.currency || '৳',
    },
    charts: {
      sales_trend: monthlyChartData,
      top_products: topProducts.topByUnits,
    },
    alerts: activeAlerts,
    insights,
  });
});

app.get('/api/analytics/sales', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const summary = aiTools.get_sales_summary(req.user?.businessId);
  const top = aiTools.get_top_products(req.user?.businessId);
  res.json({ ...summary, topProducts: top });
});

app.get('/api/analytics/profit', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const profit = aiTools.calculate_profit(req.user?.businessId);
  res.json(profit);
});

app.get('/api/analytics/inventory', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const inv = aiTools.get_inventory_status(req.user?.businessId);
  res.json(inv);
});

app.get('/api/analytics/suppliers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const businessId = req.user?.businessId;
  const suppliers = db.suppliers.filter(s => s.business_id === businessId);
  const result = suppliers.map(supplier => {
    const links = db.supplier_products.filter(sp => sp.supplier_id === supplier.id);
    const orders = db.purchase_orders.filter(po => po.business_id === businessId && po.supplier_id === supplier.id);
    const delivered = orders.filter(po => po.status === 'delivered');
    const prices = links.map(l => l.supply_price).filter(Number.isFinite);
    return {
      supplier_id: supplier.id, supplier: supplier.name, contact: supplier.contact, location: supplier.location,
      products: links.length, average_price: prices.length ? Number((prices.reduce((a,b)=>a+b,0)/prices.length).toFixed(2)) : 0,
      reliability: supplier.reliability, total_orders: orders.length, delivered_orders: delivered.length,
      fulfillment_rate: orders.length ? Number(((delivered.length/orders.length)*100).toFixed(1)) : 0,
      delivery_time: supplier.delivery_time,
    };
  });
  res.json(result);
});

// -------------------------------------------------------------
// 9. FORECAST ENDPOINTS
// -------------------------------------------------------------
app.get('/api/forecast', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const requestedDays = Number(req.query.days);
  const forecastDays = [7, 14, 30].includes(requestedDays) ? requestedDays : 14;
  const forecasts = calculateDemandForecasts(req.user?.businessId, forecastDays);
  res.json(forecasts);
});

app.get('/api/forecast/:productId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const product = db.products.find(p => p.id === req.params.productId && p.business_id === req.user?.businessId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const requestedDays = Number(req.query.days);
  const forecastDays = [7, 14, 30].includes(requestedDays) ? requestedDays : 14;
  const forecasts = calculateDemandForecasts(req.user?.businessId, forecastDays);
  const forecast = forecasts.find(f => f.product_id === product.id);
  const history = getProductSalesHistory(product.id, req.user?.businessId);
  const supplier = db.suppliers.find(s => s.id === product.supplier_id);

  res.json({
    product,
    supplier,
    forecast,
    history,
  });
});

app.get('/api/risks', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const businessId = req.user?.businessId || '';
  const risks: any[] = [];
  const products = db.products.filter(p => p.business_id === businessId && p.is_active);
  const sales = db.sales.filter(s => s.business_id === businessId);
  const expenses = db.expenses.filter(e => e.business_id === businessId);
  const supplierProducts = db.supplier_products.filter(sp => {
    const product = products.find(p => p.id === sp.product_id);
    return !!product;
  });
  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 86400000);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

  // Sales trend: recent 30d vs prior 30d.
  const recentSales = sales.filter(s => new Date(s.created_at) >= daysAgo(30));
  const previousSales = sales.filter(s => {
    const d = new Date(s.created_at);
    return d >= daysAgo(60) && d < daysAgo(30);
  });
  const recentRevenue = sum(recentSales.map(s => s.total_amount));
  const previousRevenue = sum(previousSales.map(s => s.total_amount));
  if (previousRevenue > 0) {
    const change = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    if (change <= -20) risks.push({
      type: 'sales_decline', severity: change <= -35 ? 'critical' : 'high',
      title: 'Sales decline detected',
      evidence: `Last 30 days revenue ${recentRevenue.toFixed(0)} vs ${previousRevenue.toFixed(0)} in the prior 30 days (${change.toFixed(1)}%).`,
      recommended_action: 'Review product, category, customer, and channel-level sales changes.'
    });
    if (change >= 30) risks.push({
      type: 'sales_increase', severity: 'info',
      title: 'Sales acceleration detected',
      evidence: `Last 30 days revenue increased ${change.toFixed(1)}% versus the prior 30-day period.`,
      recommended_action: 'Confirm inventory coverage and supplier capacity before demand creates stock pressure.'
    });
  }

  // Expense anomaly: recent 30d vs prior 30d.
  const recentExpense = sum(expenses.filter(e => new Date(e.date) >= daysAgo(30)).map(e => e.amount));
  const previousExpense = sum(expenses.filter(e => {
    const d = new Date(e.date);
    return d >= daysAgo(60) && d < daysAgo(30);
  }).map(e => e.amount));
  if (previousExpense > 0) {
    const change = ((recentExpense - previousExpense) / previousExpense) * 100;
    if (change >= 25) risks.push({
      type: 'expense_spike', severity: change >= 50 ? 'high' : 'medium',
      title: 'Operating expense spike detected',
      evidence: `Recent 30-day expenses are ${change.toFixed(1)}% above the previous 30-day period.`,
      recommended_action: 'Inspect expense categories and unusually large transactions before the next planning cycle.'
    });
  }

  // Product-level inventory and demand signals.
  const forecasts = calculateDemandForecasts(businessId, 30);
  forecasts.forEach(f => {
    if (f.stockout_risk === 'critical' || f.stockout_risk === 'high') {
      risks.push({
        type: 'stockout_risk', severity: f.stockout_risk,
        title: `${f.product_name} stockout risk`,
        evidence: `${f.current_stock} units remaining; average demand ${f.avg_daily_sales} units/day; estimated stockout in ~${f.estimated_stockout_days} days.`,
        recommended_action: `Review the suggested reorder of ${f.recommended_reorder_qty} units and supplier lead time.`
      });
    }
  });

  // Dead stock: meaningful stock with no sales in the last 60 days.
  products.forEach(p => {
    const recentUnits = db.sale_items
      .filter(i => i.product_id === p.id && sales.some(s => s.id === i.sale_id && new Date(s.created_at) >= daysAgo(60)))
      .reduce((n, i) => n + i.quantity, 0);
    if (p.current_stock > Math.max(p.min_stock * 2, 10) && recentUnits === 0) {
      risks.push({
        type: 'dead_stock', severity: 'medium', title: `${p.name} may be dead stock`,
        evidence: `${p.current_stock} units are on hand with no recorded units sold in the last 60 days.`,
        recommended_action: 'Review demand, promotions, pricing, or whether future replenishment should be paused.'
      });
    }
  });

  // Overstock: stock substantially above minimum with weak recent movement.
  products.forEach(p => {
    const recentUnits = db.sale_items
      .filter(i => i.product_id === p.id && sales.some(s => s.id === i.sale_id && new Date(s.created_at) >= daysAgo(30)))
      .reduce((n, i) => n + i.quantity, 0);
    if (p.current_stock > Math.max(p.min_stock * 3, 20) && recentUnits < Math.max(2, p.min_stock)) {
      risks.push({
        type: 'overstock', severity: 'medium', title: `${p.name} may be overstocked`,
        evidence: `Current stock is ${p.current_stock} units against minimum ${p.min_stock}; only ${recentUnits} units sold in the last 30 days.`,
        recommended_action: 'Slow replenishment and review pricing, promotions, and carrying cost.'
      });
    }
  });

  // Supplier price anomaly: compare current purchase price with linked supplier reference price.
  products.forEach(p => {
    const refs = supplierProducts.filter(sp => sp.product_id === p.id).map(sp => sp.supply_price).filter(v => Number.isFinite(v) && v > 0);
    if (refs.length >= 2) {
      const avg = sum(refs) / refs.length;
      const delta = ((p.purchase_price - avg) / avg) * 100;
      if (delta >= 10) risks.push({
        type: 'supplier_price_increase', severity: delta >= 20 ? 'high' : 'medium',
        title: `${p.name} supplier price variance`,
        evidence: `Current purchase price is ${delta.toFixed(1)}% above the average linked supplier reference price.`,
        recommended_action: 'Compare supplier quotations and confirm whether the increase is justified before the next order.'
      });
    }
  });

  // Profit decline: estimated operating profit for the latest two complete 30-day windows.
  const profitForWindow = (fromDays: number, toDays: number) => {
    const windowSales = sales.filter(s => {
      const d = new Date(s.created_at);
      return d < daysAgo(fromDays) && d >= daysAgo(toDays);
    });
    const windowExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d < daysAgo(fromDays) && d >= daysAgo(toDays);
    });
    return sum(windowSales.map(s => s.total_amount - s.total_cost)) - sum(windowExpenses.map(e => e.amount));
  };
  const latestProfit = profitForWindow(0, 30);
  const priorProfit = profitForWindow(30, 60);
  if (priorProfit > 0 && latestProfit < priorProfit * 0.8) {
    const change = ((latestProfit - priorProfit) / priorProfit) * 100;
    risks.push({
      type: 'profit_decline', severity: change <= -35 ? 'critical' : 'high',
      title: 'Estimated profit decline detected',
      evidence: `Estimated operating profit changed from ${priorProfit.toFixed(0)} to ${latestProfit.toFixed(0)} over consecutive 30-day windows (${change.toFixed(1)}%).`,
      recommended_action: 'Review revenue mix, COGS, discounting, and operating expenses before approving new commitments.'
    });
  }

  // Rapid inventory depletion: identify products selling materially faster than the recent baseline.
  products.forEach(p => {
    const unitsRecent = db.sale_items
      .filter(i => i.product_id === p.id && sales.some(s => s.id === i.sale_id && new Date(s.created_at) >= daysAgo(14)))
      .reduce((n, i) => n + i.quantity, 0);
    const unitsPrior = db.sale_items
      .filter(i => i.product_id === p.id && sales.some(s => {
        const d = new Date(s.created_at); return s.id === i.sale_id && d >= daysAgo(28) && d < daysAgo(14);
      }))
      .reduce((n, i) => n + i.quantity, 0);
    if (unitsPrior >= 3 && unitsRecent >= unitsPrior * 1.5 && p.current_stock <= Math.max(p.min_stock * 2, 15)) {
      risks.push({
        type: 'rapid_inventory_depletion', severity: 'high', title: `${p.name} is depleting rapidly`,
        evidence: `${unitsRecent} units sold in the last 14 days versus ${unitsPrior} in the preceding 14 days, with ${p.current_stock} units remaining.`,
        recommended_action: 'Validate the demand increase and review replenishment timing and supplier lead time.'
      });
    }
  });

  const priority = { critical: 4, high: 3, medium: 2, info: 1 } as Record<string, number>;
  risks.sort((a, b) => (priority[b.severity] || 0) - (priority[a.severity] || 0));
  res.json({ total_revenue: Number(sum(sales.map(s => s.total_amount)).toFixed(2)), generated_at: new Date().toISOString(), risks: risks.slice(0, 40) });
});

// -------------------------------------------------------------
// 10. ALERTS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/alerts', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  res.json(db.alerts.filter(a => a.business_id === req.user?.businessId));
});

app.post('/api/alerts/:id/resolve', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const alert = db.alerts.find(a => a.id === req.params.id && a.business_id === req.user?.businessId);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.is_resolved = true;
  alert.is_read = true;
  saveDb(db);
  res.json({ message: 'Alert resolved successfully', alert });
});

// -------------------------------------------------------------
// 11. AI ASSISTANT & RECOMMENDATIONS (HUMAN APPROVAL WORKFLOW)
// -------------------------------------------------------------
app.post('/api/ai/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const result = await processAiQuery(message, req.user?.businessId || '');
    res.json(result);
  } catch (err: any) {
    console.error('Error in AI chat endpoint:', err);
    res.status(500).json({ error: 'Failed to process AI query', details: err?.message });
  }
});

app.get('/api/ai/recommendations', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const recs = generateAutomatedRecommendations(req.user?.businessId || '');
  res.json(recs);
});

// Human Approval Workflow:
// AI Recommendation -> Review -> Approve / Reject -> If approved: Create Purchase Order Draft
app.post('/api/ai/recommendations/:id/approve', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rec = db.recommendations.find(r => r.id === req.params.id && r.business_id === req.user?.businessId);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  if (rec.status !== 'pending') {
    return res.status(400).json({ error: `Recommendation has already been ${rec.status}` });
  }

  const product = db.products.find(p => p.id === rec.product_id && p.business_id === req.user?.businessId);
  const supplier = db.suppliers.find(s => s.id === rec.supplier_id && s.business_id === req.user?.businessId);

  // Automatically create Purchase Order Draft
  const poId = `po-${Date.now()}`;
  const poItem: PurchaseOrderItem = {
    id: `poi-${Date.now()}`,
    purchase_order_id: poId,
    product_id: rec.product_id,
    product_name: rec.product_name,
    quantity: rec.suggested_quantity,
    unit_price: product?.purchase_price || 0,
    subtotal: rec.estimated_cost,
  };

  const newPO: PurchaseOrder = {
    id: poId,
    business_id: rec.business_id,
    supplier_id: rec.supplier_id,
    supplier_name: rec.supplier_name,
    status: 'draft', // Essential requirement: Create a purchase-order draft
    total_estimated_cost: rec.estimated_cost,
    notes: `Generated automatically via AI Recommendation approval for ${rec.product_name} (${rec.title})`,
    created_at: new Date().toISOString(),
  };

  db.purchase_orders.unshift(newPO);
  db.purchase_order_items.push(poItem);

  // Update recommendation status and link PO
  rec.status = 'approved';
  rec.purchase_order_id = poId;

  // Add audit log
  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    business_id: rec.business_id,
    user_id: req.user?.userId,
    action: 'APPROVE_AI_RECOMMENDATION',
    details: `Approved recommendation "${rec.title}". Generated Purchase Order Draft #${poId} for ${rec.suggested_quantity} units (${db.businesses.find(b => b.id === rec.business_id)?.currency || '৳'}${rec.estimated_cost}).`,
    created_at: new Date().toISOString(),
  });

  saveDb(db);

  res.json({
    message: 'Recommendation approved! Purchase Order Draft created.',
    recommendation: rec,
    purchase_order: {
      ...newPO,
      items: [poItem],
    },
  });
});

app.post('/api/ai/recommendations/:id/reject', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  const rec = db.recommendations.find(r => r.id === req.params.id && r.business_id === req.user?.businessId);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  rec.status = 'rejected';

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    business_id: rec.business_id,
    user_id: req.user?.userId,
    action: 'REJECT_AI_RECOMMENDATION',
    details: `Rejected recommendation "${rec.title}".`,
    created_at: new Date().toISOString(),
  });

  saveDb(db);
  res.json({ message: 'Recommendation rejected', recommendation: rec });
});

// Customers endpoint
app.get('/api/customers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  res.json(db.customers.filter(c => c.business_id === req.user?.businessId));
});

app.get('/api/audit-logs', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  res.json(db.audit_logs.filter(l => l.business_id === req.user?.businessId).slice(0, 250));
});

app.get('/api/employees', authenticateToken, requireRole('owner'), (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();
  res.json(db.users.filter(u => u.business_id === req.user?.businessId).map(u => ({ id:u.id, name:u.name, email:u.email, role:u.role, phone:u.phone, job_title:u.job_title, created_at:u.created_at })));
});

// Demo data reset
app.post('/api/system/reset-demo', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'owner') return res.status(403).json({ error: 'Only business owners can reset demo data' });
  const newDb = resetDatabase();
  res.json({ message: 'Demo database reset to initial verified state', productCount: newDb.products.length });
});

// Centralized API error boundary. Route handlers still return specific validation errors;
// unexpected failures are normalized here without exposing stack traces to clients.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS MOUNTING
// -------------------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SME Intelligence server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('Failed to start server:', err);
});
