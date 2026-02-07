#!/usr/bin/env node
/**
 * Syncs validation reports to the website data folder.
 *
 * Usage:
 *   node validation/sync-to-website.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, 'reports');
const WEBSITE_DATA_DIR = path.join(__dirname, '../website/src/lib/data');
const WEBSITE_PACKAGES_DIR = path.join(WEBSITE_DATA_DIR, 'packages');

// Ensure directories exist
fs.mkdirSync(WEBSITE_PACKAGES_DIR, { recursive: true });

// Copy all package reports
const reportFiles = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json') && f !== '_summary.json');
let copied = 0;

for (const file of reportFiles) {
  const src = path.join(REPORTS_DIR, file);
  const dest = path.join(WEBSITE_PACKAGES_DIR, file);
  fs.copyFileSync(src, dest);
  copied++;
}

console.log(`Copied ${copied} package reports to website`);

// Copy and transform summary
const summaryPath = path.join(REPORTS_DIR, '_summary.json');
if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  const websiteSummaryPath = path.join(WEBSITE_DATA_DIR, 'validation-summary.json');
  fs.writeFileSync(websiteSummaryPath, JSON.stringify(summary, null, 2));
  console.log('Copied validation summary');
}

console.log('\nDone! Website data updated.');
console.log(`  Reports: ${WEBSITE_PACKAGES_DIR}`);
console.log(`  Summary: ${path.join(WEBSITE_DATA_DIR, 'validation-summary.json')}`);
