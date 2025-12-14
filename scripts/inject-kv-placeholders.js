import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'wrangler.toml');
const replacements = [
  { placeholder: 'placeholder_will_be_generated', envVar: 'KV_NAMESPACE_ID_DEV', label: 'default' },
  { placeholder: 'placeholder_production_id', envVar: 'KV_NAMESPACE_ID_PROD', label: 'production' },
  { placeholder: 'placeholder_staging_id', envVar: 'KV_NAMESPACE_ID_STAGING', label: 'staging' }
];
const validLabels = replacements.map(({ label }) => label);
const targetEnv = process.env.TARGET_ENV?.toLowerCase();
// KV namespace IDs are 32-character hexadecimal strings
const namespaceIdPattern = /^[A-Fa-f0-9]{32}$/;

if (targetEnv && !validLabels.includes(targetEnv)) {
  throw new Error(`Unknown TARGET_ENV "${targetEnv}". Expected one of: ${validLabels.join(', ')}`);
}

if (!fs.existsSync(CONFIG_PATH)) {
  throw new Error(`wrangler.toml not found at ${CONFIG_PATH}`);
}

const original = fs.readFileSync(CONFIG_PATH, 'utf8');
let updated = original;
const missing = [];

for (const { placeholder, envVar, label } of replacements) {
  if (targetEnv && targetEnv !== label) {
    continue;
  }

  const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patternSource = `id\\s*=\\s*"${escapedPlaceholder}"`;
  const testPattern = new RegExp(patternSource);
  if (!testPattern.test(updated)) {
    console.log(`No ${label} placeholder found, skipping`);
    continue;
  }

  const value = process.env[envVar];
  if (!value) {
    missing.push(`${envVar} (${label})`);
    continue;
  }

  if (!namespaceIdPattern.test(value)) {
    throw new Error(`Invalid KV namespace ID "${value}" for ${label} environment`);
  }

  const replacePattern = new RegExp(patternSource, 'g');
  updated = updated.replace(replacePattern, `id = "${value}"`);
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
