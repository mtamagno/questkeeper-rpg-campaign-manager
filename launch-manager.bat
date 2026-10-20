@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  start "QuestKeeper Setup" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0setup.ps1"
  exit /b 1
)

if not exist "node_modules\.package-lock.json" (
  start "QuestKeeper Setup" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0setup.ps1"
  exit /b 1
)

node tools\campaign-manager\server.mjs --open
if errorlevel 1 pause
