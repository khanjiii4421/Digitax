$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }
$standaloneDir = Join-Path $rootDir '.next\standalone'

Write-Host "Packaging standalone deployment from: $standaloneDir"

# 1. Copy public directory to standalone
$publicSrc = Join-Path $rootDir 'public'
$publicDest = Join-Path $standaloneDir 'public'
if (Test-Path $publicSrc) {
    Copy-Item -Path $publicSrc -Destination $publicDest -Recurse -Force
    Write-Host "[1/5] Copied public/ directory"
}

# 2. Copy static assets to standalone/.next/static
$staticSrc = Join-Path $rootDir '.next\static'
$staticDest = Join-Path $standaloneDir '.next\static'
if (Test-Path $staticSrc) {
    $parentDir = Split-Path $staticDest
    if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
    Copy-Item -Path $staticSrc -Destination $staticDest -Recurse -Force
    Write-Host "[2/5] Copied .next/static/ directory"
}

# 3. Copy hardened .htaccess to standalone
$htaccessSrc = Join-Path $rootDir '.htaccess'
$htaccessDest = Join-Path $standaloneDir '.htaccess'
if (Test-Path $htaccessSrc) {
    Copy-Item -Path $htaccessSrc -Destination $htaccessDest -Force
    Write-Host "[3/5] Copied .htaccess"
}

# 4. Copy updated server.js
$serverSrc = Join-Path $rootDir 'server.js'
$serverDest = Join-Path $standaloneDir 'server.js'
if (Test-Path $serverSrc) {
    Copy-Item -Path $serverSrc -Destination $serverDest -Force
    Write-Host "[4/5] Copied server.js entrypoint"
}

# 5. Compress to digitax-deploy.zip
$zipPath = Join-Path $rootDir 'digitax-deploy.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Write-Host "[5/5] Compressing files into digitax-deploy.zip..."
$items = @(
    (Join-Path $standaloneDir 'node_modules'),
    (Join-Path $standaloneDir '.next'),
    (Join-Path $standaloneDir 'public'),
    (Join-Path $standaloneDir 'package.json'),
    (Join-Path $standaloneDir 'server.js'),
    (Join-Path $standaloneDir '.htaccess')
)

Compress-Archive -Path $items -DestinationPath $zipPath -Force
Write-Host "SUCCESS: Deployment zip created at $zipPath"
Get-Item $zipPath | Select-Object Name, Length, LastWriteTime
