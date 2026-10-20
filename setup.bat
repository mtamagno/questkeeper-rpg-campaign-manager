@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0QuestKeeper-Setup.exe" (
  start "QuestKeeper Setup" "%~dp0QuestKeeper-Setup.exe"
  exit /b 0
)
start "QuestKeeper Setup" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0setup.ps1"
