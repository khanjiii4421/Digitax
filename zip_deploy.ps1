npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Remove-Item -Path deploy_temp -Recurse -ErrorAction Ignore
New-Item -ItemType Directory -Path deploy_temp | Out-Null

Copy-Item -Path .next\standalone\* -Destination deploy_temp\ -Recurse -Force
New-Item -ItemType Directory -Path deploy_temp\.next -Force | Out-Null
Copy-Item -Path .next\static -Destination deploy_temp\.next\static -Recurse -Force
Copy-Item -Path public -Destination deploy_temp\public -Recurse -Force
Copy-Item -Path server.js, package.json, .cpanel.yml -Destination deploy_temp\ -Force
if (Test-Path .env.local) {
    Copy-Item -Path .env.local -Destination deploy_temp\ -Force
}

Remove-Item -Path deploy_live.zip -ErrorAction Ignore
Compress-Archive -Path deploy_temp\* -DestinationPath deploy_live.zip -Force
Remove-Item -Path deploy_temp -Recurse -Force

Write-Host "Deployment zip created successfully at deploy_live.zip"
