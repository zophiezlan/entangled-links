import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'wrangler.toml');
const replacements = [
  { placeholder: 'placeholder_will_be_generated', envVar: 'KV_NAMESPACE_ID_DEV', label: 'development' },
  { placeholder: 'placeholder_production_id', envVar: 'KV_NAMESPACE_ID_PROD', label: 'production' },
  { placeholder: 'placeholder_staging_id', envVar: 'KV_NAMESPACE_ID_STAGING', label: 'staging' }
];

if (!fs.existsSync(CONFIG_PATH)) {
  throw new Error(`wrangler.toml not found at ${CONFIG_PATH}`);
}

const original = fs.readFileSync(CONFIG_PATH, 'utf8');
let updated = original;
const missing = [];

for (const { placeholder, envVar, label } of replacements) {
  if (!original.includes(placeholder)) {
    console.log(`No ${label} placeholder found, skipping`);
    continue;
  }

  const value = process.env[envVar];
  if (!value) {
    missing.push(`${envVar} (${label})`);
    continue;
  }

  updated = updated.replaceAll(placeholder, value);
}

if (missing.length) {
  throw new Error(`Missing KV namespace IDs: ${missing.join(', ')}`);
}

if (updated !== original) {
  fs.writeFileSync(CONFIG_PATH, updated);
  console.log('KV namespace IDs injected into wrangler.toml');
} else {
  console.log('No changes made to wrangler.toml');
}
