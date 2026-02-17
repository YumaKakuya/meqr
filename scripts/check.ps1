# MeQR Code Check Script (Clean Version)
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1

$indexPath = Join-Path $PSScriptRoot "..\index.html"
if (-not (Test-Path $indexPath)) {
    Write-Host "Error: index.html not found at $indexPath" -ForegroundColor Red
    exit 1
}

$content = Get-Content $indexPath -Raw -Encoding UTF8
$lines = Get-Content $indexPath -Encoding UTF8
$projectRoot = Split-Path $indexPath -Parent

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " MeQR Code Check (Final)" -ForegroundColor Cyan
Write-Host "========================================`n"

# 1. Duplicates
Write-Host "[1] Duplicate function definitions" -ForegroundColor Yellow
$funcNames = @{}
$duplicates = @()
foreach ($line in $lines) {
    if ($line -match 'function\s+([a-zA-Z0-9_]+)\s*\(') {
        $name = $matches[1]
        if ($funcNames.ContainsKey($name)) { $duplicates += $name } else { $funcNames[$name] = 1 }
    }
}
if ($duplicates.Count -eq 0) { Write-Host "  OK - No duplicates" -ForegroundColor Green }
else { $duplicates | Sort-Object -Unique | ForEach-Object { Write-Host "  NG - Duplicate: $_" -ForegroundColor Red } }

# 2. alert/confirm
Write-Host "`n[2] alert/confirm remaining" -ForegroundColor Yellow
$alertCount = ([regex]::Matches($content, 'alert\(')).Count
$confirmCount = ([regex]::Matches($content, 'confirm\(')).Count
if ($alertCount + $confirmCount -eq 0) { Write-Host "  OK - Clean" -ForegroundColor Green }
else { Write-Host "  NG - alert:$alertCount, confirm:$confirmCount found" -ForegroundColor Red }

# 3. External files
Write-Host "`n[3] External file references" -ForegroundColor Yellow
$scriptMatches = [regex]::Matches($content, 'src="([^"]+\.js)"')
foreach ($m in $scriptMatches) {
    $src = $m.Groups[1].Value
    if ($src -match '^https?://') { continue }
    if (Test-Path (Join-Path $projectRoot $src)) { Write-Host "  OK: $src" -ForegroundColor Green }
    else { Write-Host "  NG: MISSING $src" -ForegroundColor Red }
}

# 4. Icons
Write-Host "`n[4] Icon files" -ForegroundColor Yellow
@("icon-192.svg","icon-512.svg","icon-192.png","icon-512.png") | ForEach-Object {
    $p = Join-Path $projectRoot "icons\$_"
    if (Test-Path $p) {
        $size = [math]::Round((Get-Item $p).Length / 1KB, 1)
        Write-Host "  OK: icons/$_ ($size KB)" -ForegroundColor Green
    } else {
        Write-Host "  NG: icons/$_ NOT FOUND" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Done" -ForegroundColor Cyan
Write-Host "========================================`n"