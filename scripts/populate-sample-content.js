import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openStore } from '../backend/store.js';
import { contentSchema } from '../backend/schema.js';
import { seed } from '../backend/seed.js';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const dbPath = process.env.DB_PATH || path.join(root, 'runtime', 'icm-preview.sqlite');
const backupPath = `${dbPath}.before-sample-content`;

if (existsSync(dbPath) && !existsSync(backupPath)) copyFileSync(dbPath, backupPath);

const samples = seed();
const store = openStore(dbPath, samples);
const draft = store.read('draft');
const next = structuredClone(draft.content);

if (!next.news.length) next.news = samples.news;
if (!next.events.length) next.events = samples.events;
if (!next.jummah.shifts.length) next.jummah = samples.jummah;

const parsed = contentSchema.parse(next);
const changed = JSON.stringify(parsed) !== JSON.stringify(draft.content);
if (changed) store.save(parsed, draft.revision, 'sample-content-setup', true);

console.log(changed ? `Sample content published to ${dbPath}` : 'No empty CMS sections needed sample content.');
