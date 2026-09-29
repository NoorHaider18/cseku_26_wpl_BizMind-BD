import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';
import type {
  DatabaseSchema,
  User,
  Business,
  Product,
  Category,
  Customer,
  Sale,
  SaleItem,
  InventoryRecord,
  InventoryTransaction,
  Supplier,
  SupplierProduct,
  PurchaseOrder,
  PurchaseOrderItem,
  Expense,
  Forecast,
  Alert,
  Recommendation,
  AiConversation,
  AiMessage,
  AuditLog,
} from '../src/types/db.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sme_db.json');
const DATABASE_URL = process.env.DATABASE_URL;
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, max: Number(process.env.DB_POOL_SIZE) || 10, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined }) : null;
let postgresReady = false;
let saveChain = Promise.resolve();

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbMemory: DatabaseSchema | null = null;

export async function initializeDatabase(): Promise<void> {
  if (!pool || postgresReady) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS bizmind_state (id INTEGER PRIMARY KEY CHECK (id = 1), data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const result = await pool.query<{data: DatabaseSchema}>('SELECT data FROM bizmind_state WHERE id = 1');
  if (result.rows[0]?.data) {
    dbMemory = result.rows[0].data;
  } else {
    dbMemory = generateSeedData();
    await pool.query('INSERT INTO bizmind_state (id, data) VALUES (1, $1::jsonb)', [JSON.stringify(dbMemory)]);
  }
  postgresReady = true;
}

export function getDb(): DatabaseSchema {
  if (dbMemory) return dbMemory;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(content);
      return dbMemory!;
    } catch (e) {
      console.error('Error loading existing db, re-seeding:', e);
    }
  }

  // Seed new database
  dbMemory = generateSeedData();
  saveDb(dbMemory);
  return dbMemory;
}

export function saveDb(data?: DatabaseSchema) {
  const toSave = data || dbMemory;
  if (!toSave) return;
  dbMemory = toSave;
  if (pool && postgresReady) {
    saveChain = saveChain.then(() => pool.query('UPDATE bizmind_state SET data = $1::jsonb, updated_at = NOW() WHERE id = 1', [JSON.stringify(toSave)])).catch(err => console.error('Failed to persist PostgreSQL state:', err));
    return;
  }
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(toSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

export function resetDatabase(): DatabaseSchema {
  dbMemory = generateSeedData();
  saveDb(dbMemory);
  return dbMemory;
}

function generateSeedData(): DatabaseSchema {
  const now = new Date('2026-09-25T09:00:00.000Z');
  const businessId = 'biz-001';

  const business: Business = {
    id: businessId,
    name: 'BizMind BD Enterprise Ltd',
    industry: 'FMCG, Retail & Wholesale Distribution',
    currency: '৳',
    location: 'Motijheel C/A, Dhaka-1000, Bangladesh',
    bin_number: '002849175-0101',
    trade_license: 'TRAD/DSCC/019284/2026',
    phone: '+880 1711-000000',
    email: 'operations@bizmindbd.com',
    created_at: '2026-03-01T08:00:00.000Z',
  };

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const users: User[] = [
    {
      id: 'usr-001',
      email: 'owner@sme.com',
      password_hash: passwordHash,
      name: 'Mamun Hasan (Founder)',
      role: 'owner',
      phone: '+880 1711-987654',
      avatar: 'bg-emerald-600',
      job_title: 'Managing Director & Founder',
      business_id: businessId,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'usr-002',
      email: 'manager@sme.com',
      password_hash: passwordHash,
      name: 'Rafiqul Islam',
      role: 'manager',
      phone: '+880 1812-456789',
      avatar: 'bg-blue-600',
      job_title: 'Operations & Inventory Lead',
      business_id: businessId,
      created_at: '2026-03-05T09:30:00.000Z',
    },
  ];

  const categories: Category[] = [
    { id: 'cat-001', business_id: businessId, name: 'Grains & Staples', description: 'Rice, wheat, grains, pulses, and flours' },
    { id: 'cat-002', business_id: businessId, name: 'Edible Oils & Sauces', description: 'Cooking oils, ghee, vinegars, and condiments' },
    { id: 'cat-003', business_id: businessId, name: 'Beverages & Drinks', description: 'Tea, coffee, sodas, juices, and water' },
    { id: 'cat-004', business_id: businessId, name: 'Personal & Home Care', description: 'Soaps, detergents, toiletries, and cleaning supplies' },
    { id: 'cat-005', business_id: businessId, name: 'Dairy & Breakfast', description: 'Milk, butter, cereals, and morning staples' },
    { id: 'cat-006', business_id: businessId, name: 'Snacks & Confectionery', description: 'Biscuits, chips, chocolate, and dry snacks' },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-001',
      business_id: businessId,
      name: 'GrainDirect Ltd',
      contact: '+880 1712000000',
      email: 'orders@graindirect.com',
      location: 'Central Agricultural Hub, Terminal 4',
      delivery_time: '2-3 business days',
      reliability: 95,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-002',
      business_id: businessId,
      name: 'Delta Oil Processors',
      contact: '+880 1712100000',
      email: 'sales@deltaoil.com',
      location: 'Industrial Harbor Zone',
      delivery_time: '3-4 business days',
      reliability: 92,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-003',
      business_id: businessId,
      name: 'Golden Harvest Milling',
      contact: '+880 1712200000',
      email: 'supply@goldenharvest.com',
      location: 'North Grain Silos',
      delivery_time: '2 business days',
      reliability: 96,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-004',
      business_id: businessId,
      name: 'Apex Beverage Dist.',
      contact: '+880 1712300000',
      email: 'logistics@apexbev.com',
      location: 'East Distribution Park',
      delivery_time: '1-2 business days',
      reliability: 98,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-005',
      business_id: businessId,
      name: 'CleanCare Supply Co.',
      contact: '+880 1712400000',
      email: 'orders@cleancare.com',
      location: 'West Chemical Park',
      delivery_time: '3-5 business days',
      reliability: 88,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-006',
      business_id: businessId,
      name: 'Sunrise Dairies',
      contact: '+880 1712500000',
      email: 'fresh@sunrisedairy.com',
      location: 'Valley Farm Road',
      delivery_time: 'Daily morning delivery',
      reliability: 94,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-007',
      business_id: businessId,
      name: 'Metro Essentials Dist.',
      contact: '+880 1712600000',
      email: 'accounts@metroessentials.com',
      location: 'Downtown Wholesale Mart',
      delivery_time: '2 business days',
      reliability: 91,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-008',
      business_id: businessId,
      name: 'SpiceCraft Commodities',
      contact: '+880 1712700000',
      email: 'sales@spicecraft.com',
      location: 'Old Port Market',
      delivery_time: '4-5 business days',
      reliability: 89,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-009',
      business_id: businessId,
      name: 'Prime Agro Traders',
      contact: '+880 1712800000',
      email: 'traders@primeagro.com',
      location: 'South Regional Depot',
      delivery_time: '3 business days',
      reliability: 90,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'sup-010',
      business_id: businessId,
      name: 'Global Snack Wholesale',
      contact: '+880 1712900000',
      email: 'info@globalsnack.com',
      location: 'Airport Logistics Hub',
      delivery_time: '2-3 business days',
      reliability: 95,
      created_at: '2026-03-01T08:00:00.000Z',
    },
  ];

  // 50 realistic products with designated prices, categories, and inventory
  interface ProductSeedDef {
    name: string;
    sku: string;
    catId: string;
    supId: string;
    purchasePrice: number;
    sellingPrice: number;
    currentStock: number;
    minStock: number;
  }

  const rawProducts: ProductSeedDef[] = [
    // Grains & Staples (10 products)
    { name: 'Rice 5kg', sku: 'GRN-RICE-05', catId: 'cat-001', supId: 'sup-001', purchasePrice: 18.50, sellingPrice: 24.00, currentStock: 34, minStock: 40 }, // Targeted low-stock
    { name: 'Basmati Rice Premium 5kg', sku: 'GRN-BASM-05', catId: 'cat-001', supId: 'sup-001', purchasePrice: 26.00, sellingPrice: 34.50, currentStock: 48, minStock: 30 },
    { name: 'Wheat Flour 10kg', sku: 'GRN-WHT-10', catId: 'cat-001', supId: 'sup-003', purchasePrice: 12.00, sellingPrice: 16.50, currentStock: 18, minStock: 25 }, // Low stock
    { name: 'All Purpose Flour 2kg', sku: 'GRN-FLR-02', catId: 'cat-001', supId: 'sup-003', purchasePrice: 3.20, sellingPrice: 4.80, currentStock: 85, minStock: 40 },
    { name: 'Red Lentils 1kg', sku: 'GRN-LNT-01', catId: 'cat-001', supId: 'sup-009', purchasePrice: 2.80, sellingPrice: 4.20, currentStock: 110, minStock: 45 },
    { name: 'Chickpeas 1kg', sku: 'GRN-CHK-01', catId: 'cat-001', supId: 'sup-009', purchasePrice: 2.90, sellingPrice: 4.40, currentStock: 65, minStock: 35 },
    { name: 'Rolled Oats 1kg', sku: 'GRN-OAT-01', catId: 'cat-001', supId: 'sup-003', purchasePrice: 3.50, sellingPrice: 5.20, currentStock: 42, minStock: 25 },
    { name: 'Brown Rice 2kg', sku: 'GRN-BRN-02', catId: 'cat-001', supId: 'sup-001', purchasePrice: 6.20, sellingPrice: 8.90, currentStock: 38, minStock: 20 },
    { name: 'Cornmeal Fine 2kg', sku: 'GRN-CRN-02', catId: 'cat-001', supId: 'sup-003', purchasePrice: 3.10, sellingPrice: 4.70, currentStock: 52, minStock: 25 },
    { name: 'Quinoa Grain 500g', sku: 'GRN-QNA-50', catId: 'cat-001', supId: 'sup-009', purchasePrice: 4.50, sellingPrice: 6.90, currentStock: 29, minStock: 20 },

    // Edible Oils & Sauces (8 products)
    { name: 'Cooking Oil 2L', sku: 'OIL-VEG-02', catId: 'cat-002', supId: 'sup-002', purchasePrice: 8.20, sellingPrice: 11.50, currentStock: 12, minStock: 30 }, // Targeted critical low-stock
    { name: 'Extra Virgin Olive Oil 1L', sku: 'OIL-EVO-01', catId: 'cat-002', supId: 'sup-002', purchasePrice: 14.50, sellingPrice: 21.00, currentStock: 24, minStock: 15 },
    { name: 'Sunflower Oil 5L', sku: 'OIL-SNF-05', catId: 'cat-002', supId: 'sup-002', purchasePrice: 16.80, sellingPrice: 22.90, currentStock: 22, minStock: 25 }, // Low stock
    { name: 'Soy Sauce Premium 500ml', sku: 'OIL-SOY-50', catId: 'cat-002', supId: 'sup-008', purchasePrice: 2.10, sellingPrice: 3.40, currentStock: 74, minStock: 30 },
    { name: 'Pure Sesame Oil 250ml', sku: 'OIL-SSM-25', catId: 'cat-002', supId: 'sup-008', purchasePrice: 4.10, sellingPrice: 6.50, currentStock: 31, minStock: 20 },
    { name: 'Tomato Paste Can 400g', sku: 'OIL-TOM-40', catId: 'cat-002', supId: 'sup-007', purchasePrice: 1.10, sellingPrice: 1.85, currentStock: 140, minStock: 50 },
    { name: 'Pure Honey 500g', sku: 'OIL-HNY-50', catId: 'cat-002', supId: 'sup-009', purchasePrice: 5.80, sellingPrice: 8.75, currentStock: 45, minStock: 25 },
    { name: 'White Vinegar 1L', sku: 'OIL-VNG-01', catId: 'cat-002', supId: 'sup-007', purchasePrice: 1.20, sellingPrice: 2.10, currentStock: 68, minStock: 30 },

    // Beverages & Drinks (8 products)
    { name: 'Premium Black Tea 100 bags', sku: 'BEV-TEA-10', catId: 'cat-003', supId: 'sup-004', purchasePrice: 4.20, sellingPrice: 6.50, currentStock: 78, minStock: 30 },
    { name: 'Instant Coffee Granules 200g', sku: 'BEV-COF-20', catId: 'cat-003', supId: 'sup-004', purchasePrice: 6.50, sellingPrice: 9.80, currentStock: 55, minStock: 25 },
    { name: 'Sparkling Mineral Water 1.5L', sku: 'BEV-WTR-15', catId: 'cat-003', supId: 'sup-004', purchasePrice: 0.90, sellingPrice: 1.75, currentStock: 160, minStock: 60 },
    { name: 'Pure Orange Juice 1L', sku: 'BEV-OJC-01', catId: 'cat-003', supId: 'sup-004', purchasePrice: 2.30, sellingPrice: 3.60, currentStock: 42, minStock: 30 },
    { name: 'Cola Can 330ml (Pack 6)', sku: 'BEV-COLA-06', catId: 'cat-003', supId: 'sup-004', purchasePrice: 3.40, sellingPrice: 5.20, currentStock: 85, minStock: 40 },
    { name: 'Green Tea Leaves 250g', sku: 'BEV-GRN-25', catId: 'cat-003', supId: 'sup-008', purchasePrice: 4.80, sellingPrice: 7.50, currentStock: 33, minStock: 20 },
    { name: 'Apple Cider Unfiltered 1L', sku: 'BEV-APL-01', catId: 'cat-003', supId: 'sup-004', purchasePrice: 3.10, sellingPrice: 4.90, currentStock: 28, minStock: 20 },
    { name: 'Coconut Water 500ml', sku: 'BEV-CCN-50', catId: 'cat-003', supId: 'sup-004', purchasePrice: 1.80, sellingPrice: 2.90, currentStock: 62, minStock: 25 },

    // Personal & Home Care (8 products)
    { name: 'Laundry Detergent 3kg', sku: 'HME-DET-03', catId: 'cat-004', supId: 'sup-005', purchasePrice: 8.50, sellingPrice: 12.80, currentStock: 14, minStock: 20 }, // Low stock
    { name: 'Dishwashing Liquid 1L', sku: 'HME-DSH-01', catId: 'cat-004', supId: 'sup-005', purchasePrice: 2.40, sellingPrice: 3.90, currentStock: 64, minStock: 30 },
    { name: 'Disinfectant Multi-Surface 750ml', sku: 'HME-DIS-75', catId: 'cat-004', supId: 'sup-005', purchasePrice: 3.20, sellingPrice: 5.10, currentStock: 48, minStock: 25 },
    { name: 'Paper Towel Rolls (4-pack)', sku: 'HME-PPR-04', catId: 'cat-004', supId: 'sup-007', purchasePrice: 4.10, sellingPrice: 6.40, currentStock: 72, minStock: 35 },
    { name: 'Moisturizing Bath Soap (4-pack)', sku: 'HME-SOP-04', catId: 'cat-004', supId: 'sup-005', purchasePrice: 3.00, sellingPrice: 4.75, currentStock: 80, minStock: 35 },
    { name: 'Fluoride Toothpaste 150g', sku: 'HME-TP-15', catId: 'cat-004', supId: 'sup-005', purchasePrice: 1.90, sellingPrice: 3.20, currentStock: 95, minStock: 40 },
    { name: 'Shampoo Anti-Dandruff 400ml', sku: 'HME-SHP-40', catId: 'cat-004', supId: 'sup-005', purchasePrice: 5.20, sellingPrice: 8.10, currentStock: 36, minStock: 25 },
    { name: 'Heavy Duty Trash Bags (30 count)', sku: 'HME-TB-30', catId: 'cat-004', supId: 'sup-007', purchasePrice: 3.80, sellingPrice: 5.95, currentStock: 50, minStock: 30 },

    // Dairy & Breakfast (8 products)
    { name: 'Fresh Milk 1L', sku: 'DRY-MLK-01', catId: 'cat-005', supId: 'sup-006', purchasePrice: 1.60, sellingPrice: 2.40, currentStock: 16, minStock: 35 }, // Critical low stock
    { name: 'Salted Butter 250g', sku: 'DRY-BTR-25', catId: 'cat-005', supId: 'sup-006', purchasePrice: 2.90, sellingPrice: 4.30, currentStock: 32, minStock: 25 },
    { name: 'Cheddar Cheese Block 500g', sku: 'DRY-CHS-50', catId: 'cat-005', supId: 'sup-006', purchasePrice: 5.40, sellingPrice: 8.20, currentStock: 27, minStock: 20 },
    { name: 'Natural Greek Yogurt 500g', sku: 'DRY-YGT-50', catId: 'cat-005', supId: 'sup-006', purchasePrice: 2.80, sellingPrice: 4.10, currentStock: 22, minStock: 20 },
    { name: 'Large Brown Eggs (12-pack)', sku: 'DRY-EGG-12', catId: 'cat-005', supId: 'sup-006', purchasePrice: 2.70, sellingPrice: 3.95, currentStock: 30, minStock: 30 },
    { name: 'Corn Flakes Breakfast Cereal 500g', sku: 'DRY-CRL-50', catId: 'cat-005', supId: 'sup-007', purchasePrice: 3.60, sellingPrice: 5.40, currentStock: 45, minStock: 25 },
    { name: 'Chocolate Granola 400g', sku: 'DRY-GRN-40', catId: 'cat-005', supId: 'sup-007', purchasePrice: 4.20, sellingPrice: 6.50, currentStock: 38, minStock: 20 },
    { name: 'Condensed Milk Sweetened 397g', sku: 'DRY-CND-39', catId: 'cat-005', supId: 'sup-006', purchasePrice: 1.70, sellingPrice: 2.65, currentStock: 82, minStock: 35 },

    // Snacks & Confectionery (8 products)
    { name: 'Potato Crisps Sea Salt 150g', sku: 'SNK-CHP-15', catId: 'cat-006', supId: 'sup-010', purchasePrice: 1.40, sellingPrice: 2.30, currentStock: 88, minStock: 40 },
    { name: 'Dark Chocolate Bar 70% 100g', sku: 'SNK-CHK-10', catId: 'cat-006', supId: 'sup-010', purchasePrice: 2.20, sellingPrice: 3.60, currentStock: 64, minStock: 30 },
    { name: 'Salted Roasted Peanuts 200g', sku: 'SNK-PNT-20', catId: 'cat-006', supId: 'sup-010', purchasePrice: 1.80, sellingPrice: 2.90, currentStock: 70, minStock: 30 },
    { name: 'Butter Cookies Tin 454g', sku: 'SNK-CKI-45', catId: 'cat-006', supId: 'sup-010', purchasePrice: 5.10, sellingPrice: 7.95, currentStock: 35, minStock: 20 },
    { name: 'Mixed Fruit Gummies 150g', sku: 'SNK-GUM-15', catId: 'cat-006', supId: 'sup-010', purchasePrice: 1.10, sellingPrice: 1.95, currentStock: 92, minStock: 40 },
    { name: 'Whole Cashew Nuts 200g', sku: 'SNK-CSH-20', catId: 'cat-006', supId: 'sup-009', purchasePrice: 4.80, sellingPrice: 7.20, currentStock: 26, minStock: 20 },
    { name: 'Cream Crackers 300g', sku: 'SNK-CRK-30', catId: 'cat-006', supId: 'sup-010', purchasePrice: 1.60, sellingPrice: 2.50, currentStock: 80, minStock: 35 },
    { name: 'Milk Chocolate Wafers (Pack 4)', sku: 'SNK-WFR-04', catId: 'cat-006', supId: 'sup-010', purchasePrice: 1.90, sellingPrice: 3.10, currentStock: 68, minStock: 30 },
  ];

  const products: Product[] = [];
  const inventory: InventoryRecord[] = [];
  const supplierProducts: SupplierProduct[] = [];

  rawProducts.forEach((p, idx) => {
    const id = `prod-${String(idx + 1).padStart(3, '0')}`;
    products.push({
      id,
      business_id: businessId,
      category_id: p.catId,
      name: p.name,
      sku: p.sku,
      purchase_price: p.purchasePrice,
      selling_price: p.sellingPrice,
      current_stock: p.currentStock,
      min_stock: p.minStock,
      supplier_id: p.supId,
      is_active: true,
      created_at: '2026-03-01T08:00:00.000Z',
    });

    inventory.push({
      id: `inv-${String(idx + 1).padStart(3, '0')}`,
      product_id: id,
      current_stock: p.currentStock,
      min_stock: p.minStock,
      last_updated: now.toISOString(),
    });

    supplierProducts.push({
      id: `sp-${String(idx + 1).padStart(3, '0')}`,
      supplier_id: p.supId,
      product_id: id,
      supply_price: p.purchasePrice,
      min_order_qty: p.catId === 'cat-001' ? 50 : 20,
      lead_time_days: p.supId === 'sup-006' ? 1 : 3,
    });
  });

  // 52 Customers
  const customerNames = [
    'Green Grocers Mart', 'City Corner Bodega', 'Sunshine Convenience', 'Westside Fresh Market',
    'Parkview Mini-Mart', 'Horizon Cafe & Bakery', 'Metro Deli & Foods', 'Lakeside Superette',
    'Oakwood Pantry', 'Bella Vista Eatery', 'Grand Union Grocers', 'Starlight Quickstop',
    'Highland Provisions', 'Golden Crust Kitchen', 'Riverside Food Depot', 'Beacon Hill Deli',
    'Summit Express Shop', 'Pine Valley Store', 'Meadow Fresh Foods', 'Silver Spoon Catering',
    'Downtown Lunchbox', 'Pacific Rim Grocers', 'Heritage Cafe Bistro', 'Eastside Food Mart',
    'Harbor View Corner', 'Red Apple Supermarket', 'Cloverfield Kitchen', 'Valley Forge Foods',
    'Blue Sky Daily', 'Maple Street Market', 'Crescent Mart', 'Cedar Ridge Provisions',
    'North Star Deli', 'Golden Leaf Kitchen', 'Sunset Boulevard Mart', 'Crown Bakery & Supply',
    'Union Square Foods', 'Liberty Corner Store', 'Trinity Food Services', 'Pioneer Groceries',
    'Springfield Delicatessen', 'Garden State Food Hub', 'Crossroads Mart', 'Urban Pantry Ltd',
    'Ocean Breeze Grocery', 'Village Green Provisions', 'First Choice Deli', 'Top Notch Corner Store',
    'Key Point Food Mart', 'Benchmark Convenience', 'Cascade Kitchens', 'Evergreen Foods Co.'
  ];

  const customers: Customer[] = customerNames.map((name, i) => ({
    id: `cust-${String(i + 1).padStart(3, '0')}`,
    business_id: businessId,
    name,
    email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    phone: `+1 (555) ${100 + i}-${2000 + i}`,
    location: `Sector ${((i % 8) + 1)}, Metro District`,
    total_spent: 0,
    created_at: '2026-03-10T10:00:00.000Z',
  }));

  // 6 Months of Expenses (April 2026 through September 2026)
  // Rent: $1,200/mo, Salaries: $2,200/mo, Electricity: $350-$480/mo,
  // Transportation: surged from $420 in April to $1,380 in Aug/Sept! (Important Anomaly)
  // Marketing: $250/mo, Maintenance: $180-$220/mo, Other: $120-$160/mo
  const expenses: Expense[] = [];
  const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

  months.forEach((m, mIdx) => {
    // Rent
    expenses.push({
      id: `exp-${m}-01`,
      business_id: businessId,
      category: 'Rent',
      amount: 950,
      date: `${m}-01`,
      description: `Commercial Warehouse & Storefront Monthly Rent (${m})`,
      created_at: `${m}-01T09:00:00.000Z`,
    });
    // Salary
    expenses.push({
      id: `exp-${m}-02`,
      business_id: businessId,
      category: 'Salary',
      amount: 1200,
      date: `${m}-15`,
      description: `Monthly Staff & Logistics Payroll (${m})`,
      created_at: `${m}-15T12:00:00.000Z`,
    });
    // Electricity
    const electricityAmt = [360, 380, 440, 480, 460, 410][mIdx];
    expenses.push({
      id: `exp-${m}-03`,
      business_id: businessId,
      category: 'Electricity',
      amount: electricityAmt,
      date: `${m}-18`,
      description: `Commercial Power & Cold Storage Utility Bill (${m})`,
      created_at: `${m}-18T10:00:00.000Z`,
    });
    // Transportation (Anomaly Surge in Aug & Sept due to fuel surcharge!)
    const transportAmt = [420, 450, 520, 780, 1340, 1380][mIdx];
    expenses.push({
      id: `exp-${m}-04`,
      business_id: businessId,
      category: 'Transportation',
      amount: transportAmt,
      date: `${m}-22`,
      description: mIdx >= 4
        ? `Freight, Fleet Fuel & Emergency Regional Logistics Surcharge (${m})`
        : `Fleet Fuel, Van Delivery & Toll Logistics (${m})`,
      created_at: `${m}-22T14:00:00.000Z`,
    });
    // Marketing
    expenses.push({
      id: `exp-${m}-05`,
      business_id: businessId,
      category: 'Marketing',
      amount: [220, 250, 260, 240, 280, 250][mIdx],
      date: `${m}-10`,
      description: `Local Trade Directory, Flyers & Wholesale Promotions (${m})`,
      created_at: `${m}-10T11:00:00.000Z`,
    });
    // Maintenance
    expenses.push({
      id: `exp-${m}-06`,
      business_id: businessId,
      category: 'Maintenance',
      amount: [160, 180, 210, 190, 240, 200][mIdx],
      date: `${m}-25`,
      description: `Shelving, Forklift Servicing & Refrigeration Check (${m})`,
      created_at: `${m}-25T15:00:00.000Z`,
    });
    // Other
    expenses.push({
      id: `exp-${m}-07`,
      business_id: businessId,
      category: 'Other',
      amount: [110, 130, 140, 120, 150, 130][mIdx],
      date: `${m}-28`,
      description: `Office Supplies, Packaging tape & Waste Disposals (${m})`,
      created_at: `${m}-28T16:00:00.000Z`,
    });
  });

  // 6 Months of Consistent Sales Transactions
  const sales: Sale[] = [];
  const saleItems: SaleItem[] = [];
  const inventoryTransactions: InventoryTransaction[] = [];

  // Generate sales for 178 days: from 2026-04-01 to 2026-09-24
  let saleIdCounter = 1;
  let saleItemIdCounter = 1;
  let invTxCounter = 1;

  // Track customer spending
  const customerSpendingMap: Record<string, number> = {};

  const startDate = new Date('2026-04-01T09:00:00.000Z');
  const endDate = new Date('2026-09-24T18:00:00.000Z');

  // Let's create ~2 to 4 sales transactions per day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 6 is Saturday
    // More sales on Thursday, Friday, Saturday
    const transactionsToday = (dayOfWeek === 5 || dayOfWeek === 6) ? 3 + (saleIdCounter % 2) : 2 + (saleIdCounter % 2);

    for (let t = 0; t < transactionsToday; t++) {
      const custIdx = (saleIdCounter * 7) % customers.length;
      const customer = customers[custIdx];
      const saleDate = new Date(d);
      saleDate.setUTCHours(9 + (t * 3), (saleIdCounter * 17) % 60, 0, 0);
      const saleDateStr = saleDate.toISOString();

      const saleId = `sale-${String(saleIdCounter++).padStart(5, '0')}`;

      // Pick 2 to 5 distinct products for this transaction
      const itemCount = 2 + (saleIdCounter % 4);
      let saleTotalAmount = 0;
      let saleTotalCost = 0;

      const chosenProducts: Product[] = [];
      for (let i = 0; i < itemCount; i++) {
        // High frequency for Rice 5kg (prod-001), Cooking Oil (prod-011), Fresh Milk (prod-035)
        let prodIndex = 0;
        if (i === 0 && saleIdCounter % 2 === 0) {
          prodIndex = 0; // Rice 5kg (prod-001)
        } else if (i === 1 && saleIdCounter % 3 === 0) {
          prodIndex = 10; // Cooking Oil 2L (prod-011)
        } else if (i === 2 && saleIdCounter % 2 === 1) {
          prodIndex = 34; // Fresh Milk 1L (prod-035)
        } else {
          prodIndex = (saleIdCounter * 3 + i * 7) % products.length;
        }

        const product = products[prodIndex];
        if (!chosenProducts.some(p => p.id === product.id)) {
          chosenProducts.push(product);
        }
      }

      chosenProducts.forEach((product) => {
        // Wholesale order quantities
        const qty = product.name === 'Rice 5kg'
          ? (6 + (saleIdCounter % 6)) // 6 to 11
          : product.name === 'Cooking Oil 2L'
            ? (5 + (saleIdCounter % 5)) // 5 to 9
            : (5 + (saleIdCounter % 8)); // 5 to 12

        const unitPrice = product.selling_price;
        const unitCost = product.purchase_price;
        const subtotal = Number((qty * unitPrice).toFixed(2));
        const costSubtotal = Number((qty * unitCost).toFixed(2));

        saleTotalAmount += subtotal;
        saleTotalCost += costSubtotal;

        saleItems.push({
          id: `item-${String(saleItemIdCounter++).padStart(6, '0')}`,
          sale_id: saleId,
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          unit_price: unitPrice,
          unit_cost: unitCost,
          subtotal,
        });

        // Inventory transaction for recent sales (keep tx history rich)
        if (saleIdCounter > 300) {
          inventoryTransactions.push({
            id: `tx-${String(invTxCounter++).padStart(6, '0')}`,
            business_id: businessId,
            product_id: product.id,
            type: 'sale',
            quantity: -qty,
            previous_stock: product.current_stock + qty,
            new_stock: product.current_stock,
            reason: `Direct sale to ${customer.name}`,
            reference_id: saleId,
            created_at: saleDateStr,
          });
        }
      });

      saleTotalAmount = Number(saleTotalAmount.toFixed(2));
      saleTotalCost = Number(saleTotalCost.toFixed(2));

      customerSpendingMap[customer.id] = (customerSpendingMap[customer.id] || 0) + saleTotalAmount;

      sales.push({
        id: saleId,
        business_id: businessId,
        customer_id: customer.id,
        customer_name: customer.name,
        total_amount: saleTotalAmount,
        total_cost: saleTotalCost,
        payment_method: (saleIdCounter % 3 === 0) ? 'Bank Transfer' : (saleIdCounter % 2 === 0 ? 'Card' : 'Cash'),
        notes: `Order #${saleId.slice(-4)}`,
        created_at: saleDateStr,
      });
    }
  }

  // Update customer total_spent
  customers.forEach(c => {
    c.total_spent = Number((customerSpendingMap[c.id] || 0).toFixed(2));
  });

  // Realistic Initial Purchase Orders
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-001',
      business_id: businessId,
      supplier_id: 'sup-004',
      supplier_name: 'Apex Beverage Dist.',
      status: 'delivered',
      total_estimated_cost: 1480.00,
      notes: 'Bi-monthly beverage replenishment',
      created_at: '2026-09-02T10:00:00.000Z',
      approved_at: '2026-09-02T14:30:00.000Z',
      delivered_at: '2026-09-04T11:00:00.000Z',
    },
    {
      id: 'po-002',
      business_id: businessId,
      supplier_id: 'sup-005',
      supplier_name: 'CleanCare Supply Co.',
      status: 'delivered',
      total_estimated_cost: 980.50,
      notes: 'Cleaning & hygiene stock replenishment',
      created_at: '2026-09-10T09:15:00.000Z',
      approved_at: '2026-09-10T11:00:00.000Z',
      delivered_at: '2026-09-14T15:20:00.000Z',
    },
    {
      id: 'po-003',
      business_id: businessId,
      supplier_id: 'sup-002',
      supplier_name: 'Delta Oil Processors',
      status: 'pending_approval',
      total_estimated_cost: 1640.00,
      notes: 'Quarterly edible oils stock',
      created_at: '2026-09-22T08:45:00.000Z',
    },
  ];

  const purchaseOrderItems: PurchaseOrderItem[] = [
    {
      id: 'poi-001',
      purchase_order_id: 'po-001',
      product_id: 'prod-019',
      product_name: 'Premium Black Tea 100 bags',
      quantity: 100,
      unit_price: 4.20,
      subtotal: 420.00,
    },
    {
      id: 'poi-002',
      purchase_order_id: 'po-001',
      product_id: 'prod-020',
      product_name: 'Instant Coffee Granules 200g',
      quantity: 80,
      unit_price: 6.50,
      subtotal: 520.00,
    },
    {
      id: 'poi-003',
      purchase_order_id: 'po-001',
      product_id: 'prod-023',
      product_name: 'Cola Can 330ml (Pack 6)',
      quantity: 100,
      unit_price: 3.40,
      subtotal: 340.00,
    },
    {
      id: 'poi-004',
      purchase_order_id: 'po-001',
      product_id: 'prod-021',
      product_name: 'Sparkling Mineral Water 1.5L',
      quantity: 200,
      unit_price: 0.90,
      subtotal: 180.00,
    },
    {
      id: 'poi-005',
      purchase_order_id: 'po-002',
      product_id: 'prod-028',
      product_name: 'Dishwashing Liquid 1L',
      quantity: 150,
      unit_price: 2.40,
      subtotal: 360.00,
    },
    {
      id: 'poi-006',
      purchase_order_id: 'po-002',
      product_id: 'prod-031',
      product_name: 'Moisturizing Bath Soap (4-pack)',
      quantity: 120,
      unit_price: 3.00,
      subtotal: 360.00,
    },
    {
      id: 'poi-007',
      purchase_order_id: 'po-002',
      product_id: 'prod-032',
      product_name: 'Fluoride Toothpaste 150g',
      quantity: 137,
      unit_price: 1.90,
      subtotal: 260.30,
    },
    {
      id: 'poi-008',
      purchase_order_id: 'po-003',
      product_id: 'prod-011',
      product_name: 'Cooking Oil 2L',
      quantity: 200,
      unit_price: 8.20,
      subtotal: 1640.00,
    },
  ];

  // Pre-calculated Forecasts matching the user's explicit example:
  // Rice 5kg: Current Stock: 34, Average Daily Sales: 8, Estimated Stockout: ~4 days, Risk: High
  const forecasts: Forecast[] = [
    {
      id: 'fc-001',
      business_id: businessId,
      product_id: 'prod-001',
      product_name: 'Rice 5kg',
      current_stock: 34,
      avg_daily_sales: 8.0,
      forecast_days: 14,
      estimated_stockout_days: 4.2,
      stockout_risk: 'high',
      recommended_reorder_qty: 120,
      calculated_at: now.toISOString(),
    },
    {
      id: 'fc-002',
      business_id: businessId,
      product_id: 'prod-011',
      product_name: 'Cooking Oil 2L',
      current_stock: 12,
      avg_daily_sales: 5.0,
      forecast_days: 14,
      estimated_stockout_days: 2.4,
      stockout_risk: 'critical',
      recommended_reorder_qty: 80,
      calculated_at: now.toISOString(),
    },
    {
      id: 'fc-003',
      business_id: businessId,
      product_id: 'prod-035',
      product_name: 'Fresh Milk 1L',
      current_stock: 16,
      avg_daily_sales: 9.0,
      forecast_days: 7,
      estimated_stockout_days: 1.8,
      stockout_risk: 'critical',
      recommended_reorder_qty: 70,
      calculated_at: now.toISOString(),
    },
    {
      id: 'fc-004',
      business_id: businessId,
      product_id: 'prod-003',
      product_name: 'Wheat Flour 10kg',
      current_stock: 18,
      avg_daily_sales: 4.0,
      forecast_days: 14,
      estimated_stockout_days: 4.5,
      stockout_risk: 'high',
      recommended_reorder_qty: 60,
      calculated_at: now.toISOString(),
    },
    {
      id: 'fc-005',
      business_id: businessId,
      product_id: 'prod-027',
      product_name: 'Laundry Detergent 3kg',
      current_stock: 14,
      avg_daily_sales: 3.0,
      forecast_days: 14,
      estimated_stockout_days: 4.6,
      stockout_risk: 'high',
      recommended_reorder_qty: 40,
      calculated_at: now.toISOString(),
    },
  ];

  // Realistic Alerts
  const alerts: Alert[] = [
    {
      id: 'alt-001',
      business_id: businessId,
      type: 'low_stock',
      severity: 'critical',
      title: 'Critical Stockout Risk: Cooking Oil 2L',
      message: 'Cooking Oil 2L has only 12 units remaining (minimum threshold: 30). With average sales of 5.0 units/day, stockout is expected in ~2.4 days.',
      related_id: 'prod-011',
      is_read: false,
      is_resolved: false,
      created_at: '2026-09-24T14:30:00.000Z',
    },
    {
      id: 'alt-002',
      business_id: businessId,
      type: 'low_stock',
      severity: 'warning',
      title: 'Low Stock Alert: Rice 5kg',
      message: 'Rice 5kg has 34 units remaining (minimum threshold: 40). Daily velocity is 8.0 units/day; projected stockout in ~4.2 days.',
      related_id: 'prod-001',
      is_read: false,
      is_resolved: false,
      created_at: '2026-09-24T11:00:00.000Z',
    },
    {
      id: 'alt-003',
      business_id: businessId,
      type: 'expense_anomaly',
      severity: 'warning',
      title: 'Expense Anomaly: Transportation Surge',
      message: 'Transportation expenses reached $2,350 in September (up 155% from April baseline of $920). Fuel surcharges and extra van routes are compressing operating margins.',
      related_id: 'exp-2026-09-04',
      is_read: false,
      is_resolved: false,
      created_at: '2026-09-23T16:00:00.000Z',
    },
    {
      id: 'alt-004',
      business_id: businessId,
      type: 'sales_decline',
      severity: 'info',
      title: 'Demand Shift: Bottled Apple Cider',
      message: 'Apple Cider Unfiltered 1L sales dipped 22% week-over-week as customer preference moved towards sparkling mineral water.',
      related_id: 'prod-025',
      is_read: true,
      is_resolved: false,
      created_at: '2026-09-21T09:00:00.000Z',
    },
  ];

  // AI Recommendations ready for the Human Approval workflow
  const recommendations: Recommendation[] = [
    {
      id: 'rec-001',
      business_id: businessId,
      title: 'Replenish Rice 5kg',
      product_id: 'prod-001',
      product_name: 'Rice 5kg',
      supplier_id: 'sup-001',
      supplier_name: 'GrainDirect Ltd',
      evidence: 'Current stock: 34 units | Average daily sales: 8.0 units | Estimated stockout: ~4 days | Minimum stock threshold: 40',
      suggested_action: 'Order 120 units at contracted supply price $18.50 ($2,220.00 total) from GrainDirect Ltd to secure 15 days of inventory buffer.',
      suggested_quantity: 120,
      estimated_cost: 2220.00,
      status: 'pending',
      created_at: '2026-09-25T08:00:00.000Z',
    },
    {
      id: 'rec-002',
      business_id: businessId,
      title: 'Urgent Reorder: Cooking Oil 2L',
      product_id: 'prod-011',
      product_name: 'Cooking Oil 2L',
      supplier_id: 'sup-002',
      supplier_name: 'Delta Oil Processors',
      evidence: 'Current stock: 12 units | Average daily sales: 5.0 units | Estimated stockout: ~2.4 days | Lead time: 3-4 days',
      suggested_action: 'Issue expedited purchase order for 80 units at $8.20 ($656.00) from Delta Oil Processors before stock completely depletes.',
      suggested_quantity: 80,
      estimated_cost: 656.00,
      status: 'pending',
      created_at: '2026-09-25T08:15:00.000Z',
    },
    {
      id: 'rec-003',
      business_id: businessId,
      title: 'Restock Fresh Milk 1L',
      product_id: 'prod-035',
      product_name: 'Fresh Milk 1L',
      supplier_id: 'sup-006',
      supplier_name: 'Sunrise Dairies',
      evidence: 'Current stock: 16 units | Average daily sales: 9.0 units | Estimated stockout: ~1.8 days',
      suggested_action: 'Order daily replenishment of 70 units at $1.60 ($112.00) from Sunrise Dairies for tomorrow morning delivery.',
      suggested_quantity: 70,
      estimated_cost: 112.00,
      status: 'pending',
      created_at: '2026-09-25T08:30:00.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-001',
      business_id: businessId,
      user_id: 'usr-001',
      action: 'SYSTEM_INIT',
      details: 'SME Intelligence database initialized with 50 products, 10 suppliers, and 6 months historical data',
      created_at: '2026-09-25T08:00:00.000Z',
    },
    {
      id: 'log-002',
      business_id: businessId,
      user_id: 'usr-002',
      action: 'FORECAST_RUN',
      details: 'Automatic demand forecasting engine evaluated 50 catalog items; flagged 5 items requiring replenishment attention',
      created_at: '2026-09-25T08:10:00.000Z',
    },
  ];

  return {
    users,
    businesses: [business],
    products,
    categories,
    customers,
    sales,
    sale_items: saleItems,
    inventory,
    inventory_transactions: inventoryTransactions,
    suppliers,
    supplier_products: supplierProducts,
    purchase_orders: purchaseOrders,
    purchase_order_items: purchaseOrderItems,
    expenses,
    forecasts,
    alerts,
    recommendations,
    ai_conversations: [],
    ai_messages: [],
    audit_logs: auditLogs,
  };
}
