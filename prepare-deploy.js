const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const standaloneDir = path.join(rootDir, '.next', 'standalone');

console.log('🚀 Starting Next.js DirectAdmin deployment preparation...');

// 1. Check if standalone build exists
if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Error: .next/standalone folder not found.');
  console.error('Please run "npm run build" first to generate the standalone build.');
  process.exit(1);
}

try {
  // 2. Copy public directory to standalone/public
  const publicSrc = path.join(rootDir, 'public');
  const publicDest = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicSrc)) {
    console.log('📂 Copying public folder...');
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log('✅ Public folder copied.');
  }

  // 3. Copy .next/static directory to standalone/.next/static
  const staticSrc = path.join(rootDir, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    console.log('📂 Copying static assets (.next/static)...');
    fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log('✅ Static assets copied.');
  }

  // 4. Patch server.js in standalone to handle Unix sockets / named pipes (process.env.PORT)
  const serverJsPath = path.join(standaloneDir, 'server.js');
  if (fs.existsSync(serverJsPath)) {
    console.log('🔧 Patching server.js to support Passenger (Unix domain sockets)...');
    let serverContent = fs.readFileSync(serverJsPath, 'utf8');
    
    // Replace parseInt(process.env.PORT, 10) with process.env.PORT
    const originalLine = 'const currentPort = parseInt(process.env.PORT, 10) || 3000';
    const patchedLine = 'const currentPort = process.env.PORT || 3000';
    
    if (serverContent.includes(originalLine)) {
      serverContent = serverContent.replace(originalLine, patchedLine);
      fs.writeFileSync(serverJsPath, serverContent, 'utf8');
      console.log('✅ server.js patched successfully.');
    } else {
      console.warn('⚠️ Warning: Could not find the port assignment line in server.js. It may have already been patched or next.js structure changed.');
    }
  }

  // 5. Zip the standalone contents for easy upload
  console.log('📦 Zipping files for deployment...');
  const zipPath = path.join(rootDir, 'digitax-deploy.zip');
  
  // Remove existing zip if it exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Run PowerShell command to zip the standalone folder contents
  // We list individual items to ensure hidden folders (like .next) are zipped correctly without inclusion issues
  const zipCmd = `powershell -Command "Compress-Archive -Path '${path.join(standaloneDir, 'node_modules')}', '${path.join(standaloneDir, '.next')}', '${path.join(standaloneDir, 'public')}', '${path.join(standaloneDir, 'package.json')}', '${path.join(standaloneDir, 'server.js')}' -DestinationPath '${zipPath}' -Force"`;
  
  execSync(zipCmd, { stdio: 'inherit' });
  console.log(`🎉 Success! Your deployment file is ready: ${zipPath}`);
  console.log('You can now upload this zip file to your server, extract it, and start the app.');

} catch (error) {
  console.error('❌ An error occurred during preparation:', error);
  process.exit(1);
}
