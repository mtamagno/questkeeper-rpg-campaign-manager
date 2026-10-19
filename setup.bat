@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. / Node.js non e' installato.
  echo Install Node.js 24 from https://nodejs.org/ and try again.
  pause
  exit /b 1
)

if not exist "node_modules\.package-lock.json" (
  echo Preparing QuestKeeper for the first run...
  echo Preparazione del primo avvio di QuestKeeper...
  call npm ci
  if errorlevel 1 (
    echo Installation failed. Check the message above and try again.
    pause
    exit /b 1
  )
)

node tools\campaign-manager\server.mjs --open
if errorlevel 1 pause
