// The industry pages (November 20, 2026): one template, one data file per industry, built by tools/build-industries.mjs.
// The pages on disk must be exactly what the data builds, so an edit to the data without a rebuild fails here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, loadIndustries } from '../tools/build-industries.mjs';

test('every industry page and the home page cards are up to date with tools/industries/*.json', () => {
  const { stale } = build({ check: true });
  assert.deepEqual(stale, [], 'run: node tools/build-industries.mjs');
});

test('eight industries, Med Spas & Wellness first, healthcare marked on the three healthcare pages only', () => {
  const list = loadIndustries();
  assert.deepEqual(list.map((d) => d.slug), ['med-spas', 'dental', 'chiropractic-physical-therapy', 'gyms-fitness-studios', 'salons-barbershops', 'restaurants-cafes', 'home-services', 'auto-shops']);
  assert.deepEqual(list.filter((d) => d.healthcare).map((d) => d.slug), ['med-spas', 'dental', 'chiropractic-physical-therapy']);
});

test('the treats stay modest on every industry page, and the healthcare pages name no healthcare partners', () => {
  for (const d of loadIndustries()) {
    for (const t of d.treatExamples) assert.doesNotMatch(t, /gift|cash|card|free |discount|voucher/i, `${d.slug}: ${t}`);
    if (d.healthcare) for (const p of d.partners) assert.doesNotMatch(p.name, /doctor|dentist|dental|pharmac|therap|chiropract|optomet|clinic|hospital|medical|physician|lab/i, `${d.slug}: ${p.name}`);
  }
});
