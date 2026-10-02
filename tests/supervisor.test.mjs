import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enrichDecisions, category, summarize, rate, wilson, csv, inScope, currentRecords } from '../src/supervisor/metrics.mjs';
const read = file => JSON.parse(readFileSync(new URL(`../data-contract/examples/${file}.json`,import.meta.url)));
const organization = read('01-organization');
const data = { interviews:read('02-interviews'), ais:read('03-ai-assessments'), decisions:read('04-decisions'), reviews:read('05-reference-reviews') };
const rows = enrichDecisions(data);
test('four audit categories and unverified cases remain distinct', () => {
  assert.deepEqual(rows.map(r => r.category), ['correct_override','over_reliance','correct_acceptance','under_reliance','unverified']);
  const s = summarize(rows);
  assert.equal(s.verified,4); assert.equal(s.discordant,2); assert.equal(s.concordant,2); assert.equal(s.changed,2); assert.equal(s.operators,1);
});
test('an incompatible reference is not treated as ground truth', () => {
  const reference = structuredClone(data.reviews[0]); reference.reference_standard.policy_version = 'different-policy';
  assert.equal(category(data.decisions[0],data.ais[0],reference),'unverified');
});
test('missing data does not become zero percent and small samples have wide intervals', () => {
  assert.equal(rate(0,0),'—'); assert.equal(wilson(0,0),null);
  const [lo,hi] = wilson(1,2); assert.ok(lo < .10 && hi > .90);
});
test('scope uses the role in the activity rather than a current profile', () => {
  assert.equal(rows.filter(r => inScope(r,{type:'operator',id:'operator-maria-fernanda-rios'})).length,0);
  assert.equal(data.interviews.filter(r => inScope(r,{type:'operator',id:'operator-maria-fernanda-rios'},'interview')).length,5);
  assert.equal(rows.filter(r => inScope(r,{type:'office',id:'office-mexico-city'})).length,5);
});
test('a superseded review is not counted twice', () => {
  assert.deepEqual(currentRecords([{id:'old',supersedes:null},{id:'new',supersedes:'old'}],'supersedes').map(r => r.id),['new']);
  const revised = structuredClone(data.reviews[0]); revised.id='review-new'; revised.supersedes_review_id=data.reviews[0].id; revised.reference_standard.outcome='exclude';
  assert.equal(enrichDecisions({...data,reviews:[...data.reviews,revised]})[0].category,'under_reliance');
});
test('CSV includes only filtered rows and escapes spreadsheet formulas', () => {
  const row=structuredClone(rows[0]); row.final_assessment.justification.text='=SUM(A1:A2)';
  const output=csv([row]); assert.ok(output.includes("'=SUM(A1:A2)")); assert.ok(!output.includes('case-demo-02')); assert.equal(output.split('\r\n').length,2);
});

test('only Mexico has offices and only the first office has operators and cases', () => {
  assert.deepEqual(organization.countries.map(c => c.iso_alpha2), ['MX','BR','SY','PS','UA','CD']);
  assert.equal(organization.offices.length,3);
  assert.ok(organization.offices.every(o => o.country_id === 'country-mexico'));
  assert.equal(organization.operators.length,2);
  assert.ok(organization.operators.every(o => o.assignments.every(a => a.office_id === 'office-mexico-city')));
  assert.ok(data.interviews.every(i => i.location.office_id === 'office-mexico-city'));
  assert.ok(rows.every(r => r.location.office_id === 'office-mexico-city'));
});
