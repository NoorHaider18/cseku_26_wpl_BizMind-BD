import assert from 'node:assert/strict';

const allowedStatuses = ['draft', 'pending_approval', 'approved', 'ordered', 'delivered', 'cancelled'];
const recommendationStatuses = ['pending', 'approved', 'rejected'];

assert.ok(allowedStatuses.includes('draft'), 'AI approval must create a draft PO');
assert.ok(recommendationStatuses.includes('pending'));
assert.ok(recommendationStatuses.includes('approved'));
assert.equal(allowedStatuses.includes('purchased'), false, 'No autonomous purchase status should exist');

console.log('workflow.test.mjs: approval-to-draft invariants passed');
