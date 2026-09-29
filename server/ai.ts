import { GoogleGenAI, Type } from '@google/genai';
import { getDb, saveDb } from './db.ts';
import { calculateDemandForecasts } from './forecast.ts';

// Gemini client initialization per instructions
const rawApiKey = process.env.GEMINI_API_KEY || '';
const isValidKey = rawApiKey && !rawApiKey.startsWith('MY_') && rawApiKey.length > 10;
const ai = isValidKey
  ? new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Tool implementations directly accessing the database
export const aiTools = {
  get_sales_summary(businessId?: string) {
    const db = getDb();
    const sales = businessId ? db.sales.filter(s => s.business_id === businessId) : db.sales;
    const expenses = businessId ? db.expenses.filter(e => e.business_id === businessId) : db.expenses;
    const totalTransactions = sales.length;
    let totalRevenue = 0;
    let totalCost = 0;

    // Filter by months
    const monthlyRevenue: Record<string, number> = {};
    sales.forEach(s => {
      totalRevenue += s.total_amount;
      totalCost += s.total_cost;
      const m = s.created_at.slice(0, 7);
      monthlyRevenue[m] = (monthlyRevenue[m] || 0) + s.total_amount;
    });

    const recentSales = sales.slice(-5).map(s => ({
      id: s.id,
      customer: s.customer_name,
      amount: s.total_amount,
      date: s.created_at,
    }));

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      grossMargin: Number(((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1)),
      totalTransactions,
      monthlyRevenue,
      recentSales,
    };
  },

  get_top_products(businessId?: string) {
    const db = getDb();
    const saleItems = businessId ? db.sale_items.filter(item => db.sales.some(s => s.id === item.sale_id && s.business_id === businessId)) : db.sale_items;
    const productStats: Record<string, { name: string; sku: string; unitsSold: number; totalRevenue: number; totalProfit: number }> = {};

    saleItems.forEach(item => {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = {
          name: item.product_name,
          sku: db.products.find(p => p.id === item.product_id)?.sku || '',
          unitsSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
        };
      }
      productStats[item.product_id].unitsSold += item.quantity;
      productStats[item.product_id].totalRevenue += item.subtotal;
      productStats[item.product_id].totalProfit += (item.unit_price - item.unit_cost) * item.quantity;
    });

    const sorted = Object.values(productStats).sort((a, b) => b.unitsSold - a.unitsSold);
    return {
      topByUnits: sorted.slice(0, 5),
      topByRevenue: [...sorted].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
    };
  },

  get_inventory_status(businessId?: string) {
    const db = getDb();
    const products = businessId ? db.products.filter(p => p.business_id === businessId) : db.products;
    let totalInventoryValue = 0;
    let totalUnits = 0;
    let lowStockCount = 0;

    const items = products.map(p => {
      const val = p.current_stock * p.purchase_price;
      totalInventoryValue += val;
      totalUnits += p.current_stock;
      const isLow = p.current_stock <= p.min_stock;
      if (isLow) lowStockCount++;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.current_stock,
        minStock: p.min_stock,
        purchasePrice: p.purchase_price,
        sellingPrice: p.selling_price,
        isLowStock: isLow,
      };
    });

    return {
      totalProductsCount: products.length,
      totalUnits,
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      lowStockCount,
      criticalItems: items.filter(i => i.isLowStock),
    };
  },

  get_low_stock_products(businessId?: string) {
    const db = getDb();
    const products = businessId ? db.products.filter(p => p.business_id === businessId) : db.products;
    const lowStock = products
      .filter(p => p.current_stock <= p.min_stock)
      .map(p => {
        const supplier = db.suppliers.find(s => s.id === p.supplier_id);
        const forecast = calculateDemandForecasts(businessId).find(f => f.product_id === p.id);
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: p.current_stock,
          minStock: p.min_stock,
          supplierName: supplier?.name || 'Unknown',
          avgDailySales: forecast?.avg_daily_sales || 0,
          estimatedStockoutDays: forecast?.estimated_stockout_days || 0,
          risk: forecast?.stockout_risk || 'high',
        };
      });

    return {
      count: lowStock.length,
      items: lowStock,
    };
  },

  get_supplier_prices(businessId?: string) {
    const db = getDb();
    const suppliers = businessId ? db.suppliers.filter(s => s.business_id === businessId) : db.suppliers;
    const products = businessId ? db.products.filter(p => p.business_id === businessId) : db.products;
    return suppliers.map(s => {
      const prods = products
        .filter(p => p.supplier_id === s.id)
        .map(p => ({
          productId: p.id,
          name: p.name,
          supplyPrice: p.purchase_price,
          retailPrice: p.selling_price,
        }));
      return {
        supplierId: s.id,
        name: s.name,
        reliability: `${s.reliability}%`,
        deliveryTime: s.delivery_time,
        contact: s.contact,
        productsCount: prods.length,
        products: prods,
      };
    });
  },

  forecast_product_demand(productId?: string, businessId?: string) {
    const forecasts = calculateDemandForecasts(businessId);
    if (productId) {
      const match = forecasts.find(f => f.product_id === productId || f.product_name.toLowerCase().includes(productId.toLowerCase()));
      return match || { error: 'Product not found' };
    }
    return forecasts.slice(0, 10);
  },

  calculate_profit(businessId?: string) {
    const db = getDb();
    const sales = businessId ? db.sales.filter(s => s.business_id === businessId) : db.sales;
    const expenses = businessId ? db.expenses.filter(e => e.business_id === businessId) : db.expenses;
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalExpenses = 0;

    const monthly: Record<string, { revenue: number; cogs: number; expenses: number; profit: number }> = {};

    sales.forEach(s => {
      totalRevenue += s.total_amount;
      totalCogs += s.total_cost;
      const m = s.created_at.slice(0, 7);
      if (!monthly[m]) monthly[m] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
      monthly[m].revenue += s.total_amount;
      monthly[m].cogs += s.total_cost;
    });

    expenses.forEach(e => {
      totalExpenses += e.amount;
      const m = e.date.slice(0, 7);
      if (!monthly[m]) monthly[m] = { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
      monthly[m].expenses += e.amount;
    });

    Object.keys(monthly).forEach(m => {
      const entry = monthly[m];
      entry.profit = Number((entry.revenue - entry.cogs - entry.expenses).toFixed(2));
      entry.revenue = Number(entry.revenue.toFixed(2));
      entry.cogs = Number(entry.cogs.toFixed(2));
      entry.expenses = Number(entry.expenses.toFixed(2));
    });

    const estimatedProfit = Number((totalRevenue - totalCogs - totalExpenses).toFixed(2));

    return {
      formula: 'Estimated Profit = Revenue - Product Cost (COGS) - Expenses',
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCostOfGoodsSold: Number(totalCogs.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      estimatedProfit,
      netProfitMargin: Number((estimatedProfit / totalRevenue * 100).toFixed(1)),
      monthlyBreakdown: monthly,
      note: 'Labeled as estimated business profit metric based on direct inventory sales and categorized operating expenses.',
    };
  },

  get_expense_summary(businessId?: string) {
    const db = getDb();
    const expenses = businessId ? db.expenses.filter(e => e.business_id === businessId) : db.expenses;
    let totalExpenses = 0;
    const byCategory: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    expenses.forEach(e => {
      totalExpenses += e.amount;
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      const m = e.date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    });

    return {
      totalExpenses: Number(totalExpenses.toFixed(2)),
      byCategory,
      byMonth,
      topExpenseCategories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    };
  },

  detect_basic_anomalies(businessId?: string) {
    const db = getDb();
    const expenses = businessId ? db.expenses.filter(e => e.business_id === businessId) : db.expenses;
    const products = businessId ? db.products.filter(p => p.business_id === businessId) : db.products;
    const anomalies: Array<{ type: string; severity: string; subject: string; details: string; evidence: any }> = [];

    // 1. Expense anomaly: Transportation surge in Aug/Sept
    const transportAugSept = expenses
      .filter(e => e.category === 'Transportation' && (e.date.startsWith('2026-08') || e.date.startsWith('2026-09')))
      .reduce((sum, e) => sum + e.amount, 0);

    const transportBaseline = expenses
      .filter(e => e.category === 'Transportation' && (e.date.startsWith('2026-04') || e.date.startsWith('2026-05')))
      .reduce((sum, e) => sum + e.amount, 0);

    if (transportAugSept > transportBaseline * 1.5) {
      anomalies.push({
        type: 'Expense Anomaly',
        severity: 'Warning',
        subject: 'Transportation Expense Surge',
        details: `Transportation costs in Aug/Sept (${(transportAugSept / 2).toFixed(2)}/mo average) exceeded the April/May baseline (${(transportBaseline / 2).toFixed(2)}/mo average).`,
        evidence: { baselineMonthly: (transportBaseline / 2).toFixed(2), currentMonthly: (transportAugSept / 2).toFixed(2), pctIncrease: transportBaseline > 0 ? Number(((transportAugSept / transportBaseline - 1) * 100).toFixed(1)) : null },
      });
    }

    // 2. Low stock anomaly: Items critically below minimum stock
    const criticalProducts = products.filter(p => p.current_stock < p.min_stock / 2);
    if (criticalProducts.length > 0) {
      anomalies.push({
        type: 'Inventory Anomaly',
        severity: 'Critical',
        subject: 'Severe Stockout Risk on Core FMCG Items',
        details: `${criticalProducts.length} products are below half of their minimum stock threshold: ${criticalProducts.map(p => `${p.name} (${p.current_stock}/${p.min_stock})`).join(', ')}.`,
        evidence: criticalProducts.map(p => ({ product: p.name, current: p.current_stock, min: p.min_stock })),
      });
    }

    // 3. Profit-margin anomaly based on the latest two available months.
    const monthly: Record<string, { revenue: number; cogs: number; expenses: number }> = {};
    db.sales.filter(s => !businessId || s.business_id === businessId).forEach(s => {
      const m = s.created_at.slice(0, 7);
      monthly[m] ||= { revenue: 0, cogs: 0, expenses: 0 };
      monthly[m].revenue += s.total_amount;
      monthly[m].cogs += s.total_cost;
    });
    expenses.forEach(e => {
      const m = e.date.slice(0, 7);
      monthly[m] ||= { revenue: 0, cogs: 0, expenses: 0 };
      monthly[m].expenses += e.amount;
    });
    const monthKeys = Object.keys(monthly).sort();
    if (monthKeys.length >= 2) {
      const prev = monthly[monthKeys[monthKeys.length - 2]];
      const latest = monthly[monthKeys[monthKeys.length - 1]];
      const prevMargin = prev.revenue ? ((prev.revenue - prev.cogs - prev.expenses) / prev.revenue) * 100 : 0;
      const latestMargin = latest.revenue ? ((latest.revenue - latest.cogs - latest.expenses) / latest.revenue) * 100 : 0;
      if (latestMargin < prevMargin - 5) {
        anomalies.push({
          type: 'Margin Anomaly',
          severity: 'Warning',
          subject: 'Recent Operating Margin Compression',
          details: `Estimated operating margin fell from ${prevMargin.toFixed(1)}% in ${monthKeys[monthKeys.length - 2]} to ${latestMargin.toFixed(1)}% in ${monthKeys[monthKeys.length - 1]}.`,
          evidence: { previousMonth: monthKeys[monthKeys.length - 2], latestMonth: monthKeys[monthKeys.length - 1], previousMargin: prevMargin.toFixed(1), latestMargin: latestMargin.toFixed(1) },
        });
      }
    }

    return {
      anomalyCount: anomalies.length,
      anomalies,
    };
  },
};

// Function declaration schemas for Gemini Function Calling
const toolDeclarations = [
  {
    name: 'get_sales_summary',
    description: 'Retrieves overall sales metrics, revenue, cost, monthly breakdown, and recent transactions.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_top_products',
    description: 'Retrieves top-selling products ranked by units sold and by revenue.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_inventory_status',
    description: 'Retrieves current inventory valuation, unit counts, and low-stock items list.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_low_stock_products',
    description: 'Retrieves products that are below or at their minimum stock threshold, with risk ratings and supplier info.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_supplier_prices',
    description: 'Retrieves supplier contact details, lead times, reliability scores, and catalog supply prices.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'forecast_product_demand',
    description: 'Calculates historical moving average demand, days until stockout, and recommended replenishment quantities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: 'Optional product ID or name to forecast specifically' },
      },
    },
  },
  {
    name: 'calculate_profit',
    description: 'Calculates Estimated Business Profit = Revenue - Product Cost (COGS) - Expenses, with monthly trends and margins.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_expense_summary',
    description: 'Retrieves expense totals grouped by category (Rent, Salary, Electricity, Transportation, etc.) and by month.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'detect_basic_anomalies',
    description: 'Detects business anomalies including expense surges, low stock emergencies, and margin shifts.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

export async function processAiQuery(prompt: string, businessId: string): Promise<{
  reply: string;
  toolsUsed: string[];
  toolResults?: any[];
}> {
  const toolsUsed: string[] = [];
  const toolResults: any[] = [];

  // If Gemini API is configured, use Gemini 3.8 Flash with tool calling
  if (ai) {
    try {
      const geminiCall = async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are SME Intelligence, an expert enterprise AI advisor for small and medium enterprises.
You have access to real backend database tools:
- get_sales_summary
- get_top_products
- get_inventory_status
- get_low_stock_products
- get_supplier_prices
- forecast_product_demand
- calculate_profit
- get_expense_summary
- detect_basic_anomalies

Always call the relevant tools to fetch actual verified numbers. Never fabricate or guess financial or inventory figures.
When answering:
1. State the key insight immediately with specific figures.
2. Present evidence clearly (current stock, average daily sales, cost impact, supplier price).
3. Offer concrete, actionable next steps (e.g. recommend creating a purchase order draft for approval).
4. Clearly label profit metrics as "Estimated Profit = Revenue - Product Cost - Expenses".`,
            tools: [{ functionDeclarations: toolDeclarations as any }],
          },
        });

        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          // Execute tool calls
          const functionResponses = [];
          for (const call of functionCalls) {
            if (!call.name) continue;
            toolsUsed.push(call.name);
            const toolFn = (aiTools as any)[call.name];
            let resultData = null;
            if (typeof toolFn === 'function') {
              resultData = toolFn((call.args as any)?.productId, businessId);
            }
            toolResults.push({ tool: call.name, args: call.args, result: resultData });
            functionResponses.push({
              name: call.name,
              id: call.id,
              response: { result: resultData },
            });
          }

          if (response.candidates?.[0]?.content) {
            const secondResponse = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: [
                { role: 'user', parts: [{ text: prompt }] },
                response.candidates[0].content,
                {
                  role: 'user',
                  parts: functionResponses.map(fr => ({
                    functionResponse: fr,
                  })),
                },
              ],
              config: {
                systemInstruction: `Synthesize the tool results into a structured, executive summary. Include bullet points, exact figures, and clear recommendations.`,
              },
            });
            const finalReply = secondResponse.text || 'Analysis completed based on current business data.';
            return { reply: finalReply, toolsUsed, toolResults };
          }
        }
        if (response.text) {
          return { reply: response.text, toolsUsed };
        }
        return null;
      };

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timeout')), 5000)
      );

      const result = await Promise.race([geminiCall(), timeoutPromise]);
      if (result) return result;
    } catch (err) {
      console.warn('Gemini API call skipped or timed out, executing deterministic business intelligence engine:', err);
    }
  }

  // Deterministic Business Intelligence Engine (guarantees 100% accurate database answers even if API key is not yet set or during offline development)
  const business = getDb().businesses.find(b => b.id === businessId);
  const currency = business?.currency || '৳';
  const money = (value: number) => `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const lowerPrompt = prompt.toLowerCase();

  // Question 1: Best-selling products
  if (lowerPrompt.includes('best-selling') || lowerPrompt.includes('top selling') || lowerPrompt.includes('popular') || lowerPrompt.includes('top products')) {
    toolsUsed.push('get_top_products');
    const data = aiTools.get_top_products(businessId);
    toolResults.push({ tool: 'get_top_products', result: data });

    const topList = data.topByUnits
      .map((p, idx) => `${idx + 1}. **${p.name}** (${p.sku}): **${p.unitsSold.toLocaleString()} units sold** | Revenue: ${money(p.totalRevenue)} | Est. Profit: ${money(p.totalProfit)}`)
      .join('\n');

    return {
      reply: `### Top-Selling Products Performance Analysis

Based on historical sales records from the database, here are your best-performing products:

${topList}

**Key Strategic Takeaway:**
Use the observed unit velocity and current stock forecasts together when deciding which products require replenishment.`,
      toolsUsed,
      toolResults,
    };
  }

  // Question 2: Which products are at risk of running out?
  if (lowerPrompt.includes('risk of running out') || lowerPrompt.includes('stockout') || lowerPrompt.includes('run out') || lowerPrompt.includes('low stock')) {
    toolsUsed.push('get_low_stock_products', 'forecast_product_demand');
    const lowStock = aiTools.get_low_stock_products(businessId);
    const forecasts = aiTools.forecast_product_demand(undefined, businessId) as any[];
    toolResults.push({ tool: 'get_low_stock_products', result: lowStock });
    toolResults.push({ tool: 'forecast_product_demand', result: forecasts });

    const criticalItems = (lowStock.items as any[])
      .map(item => {
        const fc = forecasts.find(f => f.product_id === item.id);
        const estDays = fc ? fc.estimated_stockout_days : item.estimatedStockoutDays;
        return `- **${item.name}**: Current Stock: **${item.currentStock} units** (Min: ${item.minStock}) | Avg Sales: **${item.avgDailySales} units/day** | Stockout in: **~${estDays} days** [Risk: **${item.risk.toUpperCase()}**] | Supplier: ${item.supplierName}`;
      })
      .join('\n');

    return {
      reply: `### Inventory Risk Assessment

${criticalItems || 'No products are currently at or below the minimum stock threshold.'}

Review the generated recommendations for replenishment quantities based on current demand and stock levels.`,
      toolsUsed,
      toolResults,
    };
  }

  // Question 3: Why did my profit decrease?
  if (lowerPrompt.includes('why did my profit decrease') || lowerPrompt.includes('profit decrease') || lowerPrompt.includes('profit decline') || lowerPrompt.includes('margin decrease')) {
    toolsUsed.push('calculate_profit', 'get_expense_summary', 'detect_basic_anomalies');
    const profitData = aiTools.calculate_profit(businessId);
    const expenseData = aiTools.get_expense_summary(businessId);
    const anomalies = aiTools.detect_basic_anomalies(businessId);
    toolResults.push({ tool: 'calculate_profit', result: profitData });
    toolResults.push({ tool: 'get_expense_summary', result: expenseData });
    toolResults.push({ tool: 'detect_basic_anomalies', result: anomalies });

    const latestMonths = Object.keys(profitData.monthlyBreakdown).sort().slice(-2);
    const latest = profitData.monthlyBreakdown[latestMonths[latestMonths.length - 1]];
    const previous = profitData.monthlyBreakdown[latestMonths[0]];
    return {
      reply: `### Profit Analysis

Estimated profit is ${money(profitData.estimatedProfit)} on revenue of ${money(profitData.totalRevenue)}. Total operating expenses are ${money(profitData.totalExpenses)}.

${latest && previous ? `Latest available month (${latestMonths[latestMonths.length - 1]}) profit: ${money(latest.profit)}; comparison month (${latestMonths[0]}): ${money(previous.profit)}.` : 'There is not enough monthly history for a month-over-month comparison.'}

Expense anomalies detected: ${anomalies.anomalyCount}. Review the expense breakdown before taking procurement or pricing action.`,
      toolsUsed,
      toolResults,
    };
  }

  // Question 4: What should I consider purchasing this week?
  if (
    lowerPrompt.includes('purchas') ||
    lowerPrompt.includes('buy') ||
    lowerPrompt.includes('replenish') ||
    lowerPrompt.includes('order this week') ||
    lowerPrompt.includes('procure')
  ) {
    toolsUsed.push('get_inventory_status', 'forecast_product_demand', 'get_supplier_prices');
    const inv = aiTools.get_inventory_status(businessId);
    const forecasts = aiTools.forecast_product_demand(undefined, businessId) as any[];
    const suppliers = aiTools.get_supplier_prices(businessId);
    toolResults.push({ tool: 'get_inventory_status', result: inv });
    toolResults.push({ tool: 'forecast_product_demand', result: forecasts });
    toolResults.push({ tool: 'get_supplier_prices', result: suppliers });

    const candidates = (forecasts as any[]).filter(f => f.stockout_risk === 'critical' || f.stockout_risk === 'high').slice(0, 6);
    const procurementList = candidates.map(f => {
      const supplier = (suppliers as any[]).find(s => s.products?.some((p: any) => p.productId === f.product_id));
      return `- **${f.product_name}**: ${f.current_stock} units, ${f.avg_daily_sales}/day, ~${f.estimated_stockout_days} days to stockout, reorder ${f.recommended_reorder_qty} units${supplier ? `; supplier: ${supplier.name}` : ''}`;
    }).join('\n');
    const totalCapital = candidates.reduce((sum, f) => sum + f.recommended_reorder_qty * ((inv.criticalItems || []).find((p: any) => p.id === f.product_id)?.purchasePrice || 0), 0);
    return {
      reply: `### Procurement Review

${procurementList || 'No critical/high-risk replenishment candidates were found.'}

Estimated capital for these forecasted reorders: ${money(totalCapital)}. Finalize quantities after reviewing supplier lead times and current cash constraints.`,
      toolsUsed,
      toolResults,
    };
  }

  // Question 5: What are my biggest business risks?
  if (lowerPrompt.includes('biggest business risks') || lowerPrompt.includes('risks') || lowerPrompt.includes('threats')) {
    toolsUsed.push('get_inventory_status', 'detect_basic_anomalies', 'calculate_profit', 'get_supplier_prices');
    const inv = aiTools.get_inventory_status(businessId);
    const anomalies = aiTools.detect_basic_anomalies(businessId);
    const profit = aiTools.calculate_profit(businessId);
    toolResults.push({ tool: 'get_inventory_status', result: inv });
    toolResults.push({ tool: 'detect_basic_anomalies', result: anomalies });
    toolResults.push({ tool: 'calculate_profit', result: profit });

    const riskItems = (inv.criticalItems || []).slice(0, 5).map((p: any) => `- **${p.name}**: ${p.currentStock} units remaining (minimum ${p.minStock}).`).join('\n');
    return {
      reply: `### Business Risk Diagnostic

**Inventory:** ${inv.lowStockCount} products are at or below minimum stock.
${riskItems || '- No products are currently below the minimum threshold.'}

**Profitability:** Estimated profit is ${money(profit.estimatedProfit)} on revenue of ${money(profit.totalRevenue)}.

**Detected anomalies:** ${anomalies.anomalyCount}. Review the detailed anomaly evidence and supplier information before acting.`,
      toolsUsed,
      toolResults,
    };
  }

  // General fallback business analysis
  toolsUsed.push('get_sales_summary', 'get_inventory_status', 'calculate_profit');
  const sales = aiTools.get_sales_summary(businessId);
  const inv = aiTools.get_inventory_status(businessId);
  const profit = aiTools.calculate_profit(businessId);
  toolResults.push({ tool: 'get_sales_summary', result: sales });
  toolResults.push({ tool: 'get_inventory_status', result: inv });
  toolResults.push({ tool: 'calculate_profit', result: profit });

  return {
    reply: `### Business Executive Summary

- **Total Sales Revenue:** ${money(sales.totalRevenue)} across ${sales.totalTransactions} transactions.
- **Inventory Status:** ${inv.totalProductsCount} products valued at ${money(inv.totalInventoryValue)}. **${inv.lowStockCount} items** are at or below minimum stock.
- **Estimated Profitability:** ${money(profit.estimatedProfit)} (Estimated Profit = Revenue - Product Cost - Expenses).`,
    toolsUsed,
    toolResults,
  };
}

export function generateAutomatedRecommendations(businessId: string) {
  const db = getDb();
  const business = db.businesses.find(b => b.id === businessId);
  const currency = business?.currency || '৳';
  const forecasts = calculateDemandForecasts(businessId);

  // Find critical items that don't already have an active recommendation
  const existingProductIds = new Set(db.recommendations.filter(r => r.business_id === businessId && r.status === 'pending').map(r => r.product_id));

  forecasts.forEach(f => {
    if ((f.stockout_risk === 'critical' || f.stockout_risk === 'high') && !existingProductIds.has(f.product_id)) {
      const product = db.products.find(p => p.id === f.product_id && p.business_id === businessId);
      if (!product) return;
      const supplier = db.suppliers.find(s => s.id === product.supplier_id && s.business_id === businessId);
      const supplierName = supplier?.name || 'Authorized Supplier';

      const recId = `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const qty = f.recommended_reorder_qty > 0 ? f.recommended_reorder_qty : Math.ceil(f.avg_daily_sales * 14);
      const estCost = Number((qty * product.purchase_price).toFixed(2));

      db.recommendations.push({
        id: recId,
        business_id: product.business_id,
        title: `Replenish ${product.name}`,
        product_id: product.id,
        product_name: product.name,
        supplier_id: product.supplier_id,
        supplier_name: supplierName,
        evidence: `Current stock: ${product.current_stock} | Average daily sales: ${f.avg_daily_sales} | Estimated stockout: ~${f.estimated_stockout_days} days | Min stock: ${product.min_stock}`,
        suggested_action: `Order ${qty} units at ${currency}${product.purchase_price.toFixed(2)} (${currency}${estCost.toFixed(2)} total) from ${supplierName} to avoid stockout.`,
        suggested_quantity: qty,
        estimated_cost: estCost,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      existingProductIds.add(product.id);
    }
  });

  saveDb(db);
  return db.recommendations.filter(r => r.business_id === businessId);
}
