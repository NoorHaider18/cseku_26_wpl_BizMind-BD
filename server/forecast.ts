import { getDb } from './db.ts';
import type { Forecast, StockoutRisk } from '../src/types/db.ts';

export function calculateDemandForecasts(businessId?: string, forecastDays = 14): Forecast[] {
  const db = getDb();
  const sales = businessId ? db.sales.filter(s => s.business_id === businessId) : db.sales;
  const saleItems = db.sale_items.filter(item => sales.some(s => s.id === item.sale_id));
  const products = businessId ? db.products.filter(p => p.business_id === businessId && p.is_active) : db.products.filter(p => p.is_active);

  // Let's filter sales for the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Group sales items by product and date
  const productSalesLast7Days: Record<string, number> = {};
  const productSalesLast30Days: Record<string, number> = {};

  // Map sale_id to date
  const saleDateMap = new Map<string, Date>();
  sales.forEach(s => {
    saleDateMap.set(s.id, new Date(s.created_at));
  });

  saleItems.forEach(item => {
    const saleDate = saleDateMap.get(item.sale_id);
    if (!saleDate) return;

    if (saleDate >= thirtyDaysAgo && saleDate <= now) {
      productSalesLast30Days[item.product_id] = (productSalesLast30Days[item.product_id] || 0) + item.quantity;
    }
    if (saleDate >= sevenDaysAgo && saleDate <= now) {
      productSalesLast7Days[item.product_id] = (productSalesLast7Days[item.product_id] || 0) + item.quantity;
    }
  });

  const updatedForecasts: Forecast[] = [];

  products.forEach(p => {
    const sales7 = productSalesLast7Days[p.id] || 0;
    const sales30 = productSalesLast30Days[p.id] || 0;

    // Moving average with exponential weighting towards recent 7 days:
    // avg = (7-day daily avg * 0.6) + (30-day daily avg * 0.4)
    const daily7 = sales7 / 7;
    const daily30 = sales30 / 30;
    const avgDailySales = Number((daily7 * 0.6 + daily30 * 0.4).toFixed(1)) || 0.5;

    const currentStock = p.current_stock;
    const estimatedStockoutDays = avgDailySales > 0 ? Number((currentStock / avgDailySales).toFixed(1)) : 999;

    let risk: StockoutRisk = 'low';
    if (estimatedStockoutDays <= 3 || currentStock < p.min_stock / 2) {
      risk = 'critical';
    } else if (estimatedStockoutDays <= 7 || currentStock <= p.min_stock) {
      risk = 'high';
    } else if (estimatedStockoutDays <= 14 || currentStock <= p.min_stock * 1.5) {
      risk = 'medium';
    }

    // Recommended reorder quantity based on:
    // Lead time (e.g. 3 days) + safety stock (min_stock) + 14-day cycle demand - current stock
    const leadTimeDays = 3;
    const targetBufferDays = forecastDays;
    const needed = Math.ceil(avgDailySales * (leadTimeDays + targetBufferDays) + p.min_stock - currentStock);
    const recommendedReorderQty = Math.max(0, needed);

    updatedForecasts.push({
      id: `fc-${p.id}`,
      business_id: p.business_id,
      product_id: p.id,
      product_name: p.name,
      current_stock: currentStock,
      avg_daily_sales: avgDailySales,
      forecast_days: forecastDays,
      estimated_stockout_days: estimatedStockoutDays,
      stockout_risk: risk,
      recommended_reorder_qty: recommendedReorderQty,
      calculated_at: now.toISOString(),
    });
  });

  // Sort: Critical & high risk first
  const riskPriority = { critical: 4, high: 3, medium: 2, low: 1 };
  updatedForecasts.sort((a, b) => {
    const rDiff = riskPriority[b.stockout_risk] - riskPriority[a.stockout_risk];
    if (rDiff !== 0) return rDiff;
    return a.estimated_stockout_days - b.estimated_stockout_days;
  });

  return updatedForecasts;
}

export function getProductSalesHistory(productId: string, businessId?: string) {
  const db = getDb();
  const sales = businessId ? db.sales.filter(s => s.business_id === businessId) : db.sales;
  const items = db.sale_items.filter(i => i.product_id === productId && sales.some(s => s.id === i.sale_id));

  const saleDateMap = new Map<string, string>();
  sales.forEach(s => {
    saleDateMap.set(s.id, s.created_at.slice(0, 10));
  });

  // Group quantity by date for last 30 days
  const dailyMap: Record<string, number> = {};
  items.forEach(it => {
    const dateStr = saleDateMap.get(it.sale_id);
    if (dateStr) {
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + it.quantity;
    }
  });

  const history: { date: string; quantity: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    history.push({
      date: dateKey,
      quantity: dailyMap[dateKey] || 0,
    });
  }

  return history;
}
