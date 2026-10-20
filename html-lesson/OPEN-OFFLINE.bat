@echo off
rem Otkryt gotovuyu prezentaciyu bez servera i bez Node.js (dist\index.html)
cd /d "%~dp0"
if exist "dist\index.html" (
  start "" "dist\index.html"
) else (
  echo dist\index.html not found. Run START.bat or "npm run build" first.
  pause
)
