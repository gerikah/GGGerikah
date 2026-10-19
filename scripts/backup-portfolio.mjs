import { loadEnvFile } from 'node:process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
loadEnvFile('frontend/.env.local');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const backup = { exported_at: new Date().toISOString(), project: new URL(process.env.SUPABASE_URL).hostname };
const tables = ['projects', 'project_sections', 'project_media', 'homepage_content', 'site_settings', 'capabilities'];
for (const table of tables) {
  const { data, error } = await client.from(table).select('*');
  if (error) throw new Error(`${table}: ${error.message}`);
  backup[table] = data;
}
await mkdir('database/backups', { recursive: true });
const path = `database/backups/portfolio-${Date.now()}.json`;
await writeFile(path, JSON.stringify(backup, null, 2));
const verified = JSON.parse(await readFile(path, 'utf8'));
console.log(JSON.stringify({ path, counts: Object.fromEntries(tables.map(t => [t, verified[t].length])) }));
