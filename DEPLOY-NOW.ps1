# DIGITAX - Complete Build and Package Script (Fixed)
# Run: powershell -ExecutionPolicy Bypass -File DEPLOY-NOW.ps1

$ErrorActionPreference = 'Stop'
$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIGITAX Production Build and Package  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $rootDir

# STEP 1: Build Next.js
Write-Host "[1/6] Running Next.js production build..." -ForegroundColor Yellow
Write-Host "      This takes 2-5 minutes, please wait..." -ForegroundColor Gray

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed. Fix errors above then re-run." -ForegroundColor Red
    exit 1
}
Write-Host "[1/6] Build SUCCESSFUL!" -ForegroundColor Green

$standalone = Join-Path $rootDir '.next\standalone'

# STEP 2: Copy public/ into standalone
Write-Host ""
Write-Host "[2/6] Copying public/ into standalone..." -ForegroundColor Yellow
$publicSrc  = Join-Path $rootDir 'public'
$publicDest = Join-Path $standalone 'public'
if (Test-Path $publicSrc) {
    Copy-Item -Path $publicSrc -Destination $publicDest -Recurse -Force
    Write-Host "      public/ copied OK" -ForegroundColor Green
}

# STEP 3: Copy .next/static into standalone/.next/static
Write-Host "[3/6] Copying .next/static into standalone..." -ForegroundColor Yellow
$staticSrc  = Join-Path $rootDir '.next\static'
$staticDest = Join-Path $standalone '.next\static'
if (Test-Path $staticSrc) {
    $parent = Split-Path $staticDest
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Copy-Item -Path $staticSrc -Destination $staticDest -Recurse -Force
    Write-Host "      .next/static/ copied OK" -ForegroundColor Green
}

# STEP 4: Copy server.js, .env, .htaccess into standalone
Write-Host "[4/6] Copying config files into standalone..." -ForegroundColor Yellow

Copy-Item (Join-Path $rootDir 'server.js')    (Join-Path $standalone 'server.js')    -Force
Copy-Item (Join-Path $rootDir '.env')         (Join-Path $standalone '.env')         -Force
Copy-Item (Join-Path $rootDir 'package.json') (Join-Path $standalone 'package.json') -Force

if (Test-Path (Join-Path $rootDir '.htaccess')) {
    Copy-Item (Join-Path $rootDir '.htaccess') (Join-Path $standalone '.htaccess') -Force
}
Write-Host "      Config files copied OK" -ForegroundColor Green

# STEP 5: Create ZIP (file-by-file to avoid permission errors on node_modules)
Write-Host ""
Write-Host "[5/6] Creating digitax-deploy.zip..." -ForegroundColor Yellow
Write-Host "      Collecting files (skipping locked system files)..." -ForegroundColor Gray

$zipPath = Join-Path $rootDir 'digitax-deploy.zip'
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Use a temp staging folder to avoid node_modules permission issues
$tempStage = Join-Path $rootDir '_deploy_stage'
if (Test-Path $tempStage) {
    Remove-Item $tempStage -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $tempStage -Force | Out-Null

# Copy standalone structure to staging (excludes nothing yet)
# We copy folder by folder to handle errors gracefully
$foldersToStage = @('.next', 'public', 'node_modules')
foreach ($folder in $foldersToStage) {
    $src = Join-Path $standalone $folder
    $dst = Join-Path $tempStage $folder
    if (Test-Path $src) {
        Write-Host "      Staging $folder ..." -ForegroundColor Gray
        try {
            Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "      Warning: some files in $folder skipped (locked)" -ForegroundColor DarkYellow
        }
    }
}

# Copy individual files
$filesToStage = @('server.js', '.env', 'package.json', '.htaccess')
foreach ($file in $filesToStage) {
    $src = Join-Path $standalone $file
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $tempStage $file) -Force -ErrorAction SilentlyContinue
    }
}

# Now compress the staging folder
Write-Host "      Compressing into ZIP..." -ForegroundColor Gray
Compress-Archive -Path "$tempStage\*" -DestinationPath $zipPath -Force

# Cleanup staging
Remove-Item $tempStage -Recurse -Force -ErrorAction SilentlyContinue

$zipInfo = Get-Item $zipPath
$sizeMB  = [math]::Round($zipInfo.Length / 1MB, 1)
Write-Host "      ZIP created: $($zipInfo.Name) ($sizeMB MB)" -ForegroundColor Green

# STEP 6: Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUILD COMPLETE - READY TO UPLOAD      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ZIP Location:" -ForegroundColor White
Write-Host "  $zipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Upload this ZIP to cPanel and extract it to:" -ForegroundColor White
Write-Host "  /home/tadbeer/domains/digitax.pk/public_html/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Then setup Node.js App in cPanel (see guide)" -ForegroundColor White

Start-Process explorer.exe $rootDir
