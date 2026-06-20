/**
 * Custom server for cPanel Node.js deployment
 *
 * After running `npm run build`, Next.js creates a standalone server
 * at .next/standalone/server.js. This file bootstraps it so cPanel
 * can start the app with `node server.js`.
 *
 * cPanel sets the PORT env var automatically in the Node.js App settings.
 */

const path = require('path');

// The standalone build is at .next/standalone
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

try {
  require(standaloneServer);
} catch (err) {
  console.error('Failed to load standalone server. Did you run `npm run build`?');
  console.error(err);
  process.exit(1);
}
