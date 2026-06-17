@echo off
REM Double-cliquez ce fichier pour lancer AI-Think-Thank (Windows).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js n'est pas installe. Installez-le depuis https://nodejs.org
  echo  puis double-cliquez a nouveau sur ce fichier.
  echo.
  pause
  exit /b 1
)
node scripts\launch.mjs
echo.
echo  L'application est arretee. Vous pouvez fermer cette fenetre.
pause
