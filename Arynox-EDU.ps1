# Arynox-EDU PS Launcher — double-click to start
param([switch]$NoBrowser, [switch]$Build)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$host.UI.RawUI.WindowTitle = "Arynox-EDU Launcher"

Write-Host "╔══════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║        Arynox-EDU Launcher          ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Magenta

# 1. Check Node
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "`n[✖] Node.js not found!" -ForegroundColor Red
    Write-Host "    Install from: https://nodejs.org" -ForegroundColor DarkYellow
    Write-Host "    Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "`n[✓] Node.js $(node --version)" -ForegroundColor Green

# 2. Install deps if needed
if (-not (Test-Path "$root\node_modules\next\package.json")) {
    Write-Host "[*] Installing dependencies..." -ForegroundColor Yellow
    Push-Location $root
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✖] npm install failed" -ForegroundColor Red
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Pop-Location
    Write-Host "[✓] Dependencies installed" -ForegroundColor Green
}

# 3. Create .env from example
if (-not (Test-Path "$root\.env") -and (Test-Path "$root\.env.example")) {
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "[*] Created .env from .env.example" -ForegroundColor Yellow
}

# 4. Determine mode
$mode = if (Test-Path "$root\.next\BUILD_ID") { "start" } else { "dev" }
Write-Host "[*] Mode: $mode" -ForegroundColor Cyan

# 5. Kill old processes on port 3000
$oldPids = netstat -ano | Select-String ":3000.*LISTENING" | ForEach-Object {
    $_ -split '\s+' | Select-Object -Last 1
} | Where-Object { $_ -ne $null -and $_ -ne "" } | Select-Object -Unique

foreach ($pid in $oldPids) {
    try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
}
Start-Sleep -Milliseconds 500

# 6. Launch
$url = "http://localhost:3000"
Write-Host "[*] Starting server on $url ..." -ForegroundColor Cyan

if (-not $NoBrowser) {
    Start-Process $url
}

Push-Location $root
try {
    $proc = Start-Process -FilePath "npx" -ArgumentList "next $mode --port 3000" -NoNewWindow -PassThru
    $proc.WaitForExit()
} catch {
    Write-Host "[✖] Server crashed: $_" -ForegroundColor Red
}
Pop-Location

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")