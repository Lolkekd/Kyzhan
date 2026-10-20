@echo off
rem ================================================================
rem  Zapusk prezentacii "Informatika | Ashyq sabaq"
rem  Dvojnoj klik: ustanovka (1-j raz), sborka i otkrytie v brauzere
rem ================================================================
cd /d "%~dp0"
title Informatika - Ashyq sabaq

where node >nul 2>nul
if errorlevel 1 goto nonode

if exist "node_modules\" goto build
echo.
echo  First run: installing dependencies, internet is required once...
echo.
call npm install
if errorlevel 1 goto opendist

:build
echo.
echo  Building the presentation...
call npm run build
if errorlevel 1 goto opendist
echo.
echo  Presentation: http://localhost:4173
echo  Do NOT close this window during the lesson.
echo.
call npm run start
goto end

:opendist
echo.
echo  Could not build. Opening the ready-made version from the dist folder...
if exist "dist\index.html" start "" "dist\index.html"
pause
goto end

:nonode
echo.
echo  Node.js is not installed. Opening the ready-made version...
if exist "dist\index.html" goto opennow
echo  dist\index.html not found. Install Node.js LTS from https://nodejs.org
pause
goto end
:opennow
start "" "dist\index.html"

:end
