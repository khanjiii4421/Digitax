/**
 * DIGITAX Production Entry Point for cPanel / DirectAdmin / CloudLinux Passenger
 * 
 * Supports:
 * - TCP Port binding (standard reverse proxy)
 * - Unix domain sockets (Phusion Passenger / DirectAdmin Node.js App)
 * - Next.js Standalone runtime
 */

const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'production';

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServer)) {
  // Standalone server located in .next/standalone/
  try {
    require(standaloneServer);
  } catch (err) {
    console.error('❌ Failed to run .next/standalone/server.js:', err);
    process.exit(1);
  }
} else {
  // Standalone server unpacked directly into current directory
  try {
    const { startServer } = require('next/dist/server/lib/start-server');
    let nextConfig = {};
    const configFile = path.join(__dirname, '.next', 'required-server-files.json');
    if (fs.existsSync(configFile)) {
      nextConfig = require(configFile).config || {};
    }

    const rawPort = process.env.PORT || 3000;
    const port = /^\d+$/.test(String(rawPort)) ? parseInt(rawPort, 10) : rawPort;
    const hostname = process.env.HOSTNAME || '0.0.0.0';

    startServer({
      dir: __dirname,
      isDev: false,
      config: nextConfig,
      hostname,
      port,
      allowRetry: false,
    }).catch((err) => {
      console.error('❌ Next.js startServer error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Fatal bootstrap error:', err);
    process.exit(1);
  }
}
