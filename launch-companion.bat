@echo off
setlocal
cd /d "%~dp0"

if exist "%~dp0QuestKeeper-Setup.exe" (
  start "QuestKeeper Companion" "%~dp0QuestKeeper-Setup.exe" --launch-companion
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  start "QuestKeeper Setup" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0setup.ps1"
  exit /b 1
)

if not exist "node_modules\.package-lock.json" (
  start "QuestKeeper Setup" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0setup.ps1"
  exit /b 1
)

call npm.cmd start -- --open
if errorlevel 1 pause
