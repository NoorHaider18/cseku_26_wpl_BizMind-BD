export type UserRole = 'owner' | 'manager';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  job_title?: string;
  business_id: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  industry: string;
  currency: string;
  location?: string;
  bin_number?: string;
  trade_license?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  description: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  total_spent: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  name: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  min_stock: number;
  supplier_id: string;
  is_active: boolean;
  created_at: string;
}

export interface InventoryRecord {
  id: string;
  product_id: string;
  current_stock: number;
  min_stock: number;
  last_updated: string;
}

export type InventoryTransactionType = 'stock_in' | 'stock_out' | 'adjustment' | 'sale' | 'purchase';

export interface InventoryTransaction {
  id: string;
  business_id: string;
  product_id: string;
  type: InventoryTransactionType;
  quantity: number; // positive or negative
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  contact: string;
  email: string;
  location: string;
  delivery_time: string; // e.g. "2-3 business days"
  reliability: number; // percentage 0 - 100
  created_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supply_price: number;
  min_order_qty: number;
  lead_time_days: number;
}

export interface Sale {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name: string;
  total_amount: number;
  total_cost: number;
  payment_method: string;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
}

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'delivered' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  business_id: string;
  supplier_id: string;
  supplier_name: string;
  status: PurchaseOrderStatus;
  total_estimated_cost: number;
  notes?: string;
  created_at: string;
  approved_at?: string;
  delivered_at?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Salary'
  | 'Electricity'
  | 'Transportation'
  | 'Marketing'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  business_id: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  created_at: string;
}

export type StockoutRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Forecast {
  id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  avg_daily_sales: number;
  forecast_days: number;
  estimated_stockout_days: number;
  stockout_risk: StockoutRisk;
  recommended_reorder_qty: number;
  calculated_at: string;
}

export type AlertType = 'low_stock' | 'sales_decline' | 'expense_anomaly' | 'supplier_price_increase';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  business_id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export type RecommendationStatus = 'pending' | 'approved' | 'rejected';

export interface Recommendation {
  id: string;
  business_id: string;
  title: string;
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  evidence: string;
  suggested_action: string;
  suggested_quantity: number;
  estimated_cost: number;
  status: RecommendationStatus;
  purchase_order_id?: string;
  created_at: string;
}

export interface AiConversation {
  id: string;
  business_id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  tool_calls?: string; // JSON string of tools called
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  action: string;
  details: string;
  created_at: string;
}

export interface DatabaseSchema {
  users: User[];
  businesses: Business[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  sale_items: SaleItem[];
  inventory: InventoryRecord[];
  inventory_transactions: InventoryTransaction[];
  suppliers: Supplier[];
  supplier_products: SupplierProduct[];
  purchase_orders: PurchaseOrder[];
  purchase_order_items: PurchaseOrderItem[];
  expenses: Expense[];
  forecasts: Forecast[];
  alerts: Alert[];
  recommendations: Recommendation[];
  ai_conversations: AiConversation[];
  ai_messages: AiMessage[];
  audit_logs: AuditLog[];
}
