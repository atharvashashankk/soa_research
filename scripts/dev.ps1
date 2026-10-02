$ErrorActionPreference = 'Stop'
$researchRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $researchRoot
$researchNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $researchNode) {
    $researchPortable = Get-ChildItem -LiteralPath (Join-Path $researchRoot '.tools') -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'node-*-win-x64' } | Sort-Object Name -Descending | Select-Object -First 1
    if ($researchPortable) { $env:PATH = "$($researchPortable.FullName);$env:PATH" }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 or newer before starting the preview.' }
if (-not (Test-Path -LiteralPath (Join-Path $researchRoot 'node_modules'))) { throw 'Install dependencies with npm ci before starting the preview.' }
& node scripts/build.mjs
if ($LASTEXITCODE -ne 0) { throw 'Site build failed. See the output above.' }
& node scripts/serve.mjs
