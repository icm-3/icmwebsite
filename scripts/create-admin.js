import { openStore } from '../backend/store.js';
import { seed } from '../backend/seed.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const username=process.env.ICM_ADMIN_USERNAME,password=process.env.ICM_ADMIN_PASSWORD;
if(!username||!password)throw new Error('Set ICM_ADMIN_USERNAME and ICM_ADMIN_PASSWORD for this command.');
const store=openStore(process.env.DB_PATH||path.join(root,'runtime/icm.sqlite'),seed());
store.addUser(username,password);store.db.close();console.log('Administrator saved. Sign in at /admin.');
