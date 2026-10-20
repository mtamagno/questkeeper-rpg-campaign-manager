@echo off
setlocal
cd /d "%~dp0"
start "QuestKeeper Setup" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0setup.ps1"
