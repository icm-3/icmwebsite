import { createApp } from '../server.js';
import { fileURLToPath } from 'node:url';

const port = 4180;
const dbPath = fileURLToPath(new URL('../runtime/icm-preview.sqlite', import.meta.url));
const { server } = createApp({ dbPath });
server.listen(port, '0.0.0.0', () => {
  console.log(`ICM Connected is listening on this computer and the local network (port ${port}).`);
});
