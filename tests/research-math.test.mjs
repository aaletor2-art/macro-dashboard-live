import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/research-math.js';
const M=globalThis.ResearchMath;
test('R uses original cash risk; blanks and percent risk are not zero',()=>{
 assert.equal(M.rMultiple({form:{'trade-pnl':'200','trade-risk':'10%' }}),null);
 assert.equal(M.rMultiple({form:{'trade-pnl':'','trade-risk':'100'}}),null);
 assert.equal(M.rMultiple({form:{'trade-pnl':'200','trade-risk':'500'},analysisEntry:{form:{'trade-risk':'£100'}}}),2);
 assert.equal(M.cashRisk('£1,000'),1000);assert.equal(M.cashRisk('0'),null);
});
test('expectancy and sample deviation use complete R observations',()=>{
 const rows=[2,-1,0].map(r=>({form:{'trade-pnl':String(r*100),'trade-risk':'100'}}));
 const s=M.summary(rows);assert.equal(s.rn,3);assert.equal(s.meanR,1/3);assert.ok(Math.abs(s.sdR-Math.sqrt(7/3))<1e-12);assert.equal(s.winRate,1/3);
});
test('chronological evaluation keeps a shared exit date on one side',()=>{
 const rows=Array.from({length:10},(_,i)=>({id:String(i),form:{'trade-exit-date':`2026-10-${i<8?'01':'02'}`}}));
 const {early,later}=M.chronologicalSplit(rows.reverse());assert.equal(early.length,8);assert.equal(later.length,2);
 assert.equal(M.chronologicalSplit(rows.slice(0,4)).early.length,0);
});
test('capital surface matches compounding and tracks unfunded withdrawals',()=>{
 const grid=M.capitalSurface({capital:1000,deposit:100,withdrawal:50,rate:1,spread:1,months:2});
 assert.equal(grid[4][2].z,1120.6);assert.equal(grid[0][2].z,1100);assert.equal(grid.length,9);
 const depleted=M.capitalSurface({capital:100,deposit:0,withdrawal:150,rate:0,spread:0,months:2});
 assert.equal(depleted[0][2].z,0);assert.equal(depleted[0][2].unfunded,200);
 assert.equal(M.capitalSurface({capital:100,deposit:-1,withdrawal:0,rate:0,spread:0,months:2}),null);
});
