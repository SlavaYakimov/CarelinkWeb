import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads `.env.local` from cwd into process.env without overriding existing vars (CI-safe).
 */
export function loadEnvLocal(filename = '.env.local') {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    for (let i = 0; i < 3; i += 1) {
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1).trim();
      } else {
        break;
      }
    }
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
  return true;
}
