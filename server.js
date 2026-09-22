/**
 * DIGITAX Production Entry Point
 * Compatible with: cPanel Passenger, Node.js App, Phusion Passenger
 * 
 * This file is the APPLICATION STARTUP POINT set in cPanel Node.js App.
 * After uploading, set "Application startup file" to: server.js
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ── Force production mode ────────────────────────────────────────────────────
process.env.NODE_ENV = 'production';

// ── Load .env from app root (cPanel doesn't inject env vars automatically) ───
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
  console.log('[server.js] Loaded .env from:', envFile);
}

// ── Resolve port / socket ────────────────────────────────────────────────────
// cPanel Passenger passes PORT as a Unix socket path OR a numeric port
const rawPort = process.env.PORT || 3000;
const isSocket = typeof rawPort === 'string' && rawPort.startsWith('/');
const port     = isSocket ? rawPort : parseInt(String(rawPort), 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

console.log(`[server.js] Starting DIGITAX — port/socket: ${port}, env: ${process.env.NODE_ENV}`);

// ── Boot Next.js standalone server ──────────────────────────────────────────
// Next.js standalone output puts the real server at .next/standalone/server.js
// After build + zip extraction, the standalone files are in the app root itself
const candidates = [
  // Option 1: files extracted directly to app root (our zip structure)
  path.join(__dirname, '.next', 'standalone', 'server.js'),
  // Option 2: standalone unpacked to same directory
  path.join(__dirname, 'standalone', 'server.js'),
];

let started = false;
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    console.log('[server.js] Booting standalone server from:', candidate);
    try {
      require(candidate);
      started = true;
      break;
    } catch (err) {
      console.error('[server.js] Failed to load:', candidate, err.message);
    }
  }
}

// ── Fallback: boot via Next.js startServer API ───────────────────────────────
if (!started) {
  console.log('[server.js] Standalone not found — using Next.js startServer API');
  try {
    const { startServer } = require('next/dist/server/lib/start-server');

    let config = {};
    const reqFilePath = path.join(__dirname, '.next', 'required-server-files.json');
    if (fs.existsSync(reqFilePath)) {
      config = require(reqFilePath).config || {};
    }

    startServer({
      dir: __dirname,
      isDev: false,
      config,
      hostname,
      port,
      allowRetry: false,
    }).catch((err) => {
      console.error('[server.js] startServer error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[server.js] FATAL — cannot start Next.js:', err.message);
    process.exit(1);
  }
}
