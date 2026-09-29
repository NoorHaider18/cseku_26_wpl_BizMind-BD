import assert from 'node:assert/strict';

// Pure logic regression checks mirroring the thresholds used by /api/risks.
function pctChange(current, previous) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}
function isSalesDecline(current, previous) {
  const change = pctChange(current, previous);
  return change !== null && change <= -20;
}
function isExpenseSpike(current, previous) {
  const change = pctChange(current, previous);
  return change !== null && change >= 25;
}
function isRapidDepletion(recentUnits, priorUnits, stock, minStock) {
  return priorUnits >= 3 && recentUnits >= priorUnits * 1.5 && stock <= Math.max(minStock * 2, 15);
}

assert.equal(isSalesDecline(70, 100), true);
assert.equal(isSalesDecline(85, 100), false);
assert.equal(isExpenseSpike(130, 100), true);
assert.equal(isExpenseSpike(120, 100), false);
assert.equal(isRapidDepletion(9, 5, 8, 5), true);
assert.equal(isRapidDepletion(6, 5, 40, 5), false);
assert.equal(pctChange(0, 0), null);

console.log('risk-engine.test.mjs: all checks passed');
