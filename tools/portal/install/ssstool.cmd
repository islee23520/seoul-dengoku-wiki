@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo NODE24_REQUIRED 1>&2
  exit /b 2
)
node "%~dp0install.mjs" %*
exit /b %errorlevel%
