$ErrorActionPreference = 'Stop'
$ProjectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectDirectory

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js is not installed. Install Node.js 24 from https://nodejs.org/' -ForegroundColor Red
    Read-Host 'Premi Invio per chiudere'
    exit 1
}

if (-not (Test-Path -LiteralPath 'node_modules/.package-lock.json')) {
    Write-Host 'Preparing QuestKeeper for the first run / Preparazione del primo avvio...'
    & npm ci
    if ($LASTEXITCODE -ne 0) {
        Read-Host 'Installation failed. Press Enter to close'
        exit $LASTEXITCODE
    }
}

node tools/campaign-manager/server.mjs --open
