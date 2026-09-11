const { execSync } = require('child_process');
try {
   execSync('ssh desktop "taskkill /f /im Unity.exe /t"', { encoding: 'utf8', stdio: 'pipe' });
} catch(e) {}
try {
   execSync('ssh desktop "powershell -Command \\"Get-Process | Where-Object { $_.ProcessName -match \'Unity\' } | Stop-Process -Force\\""', { encoding: 'utf8', stdio: 'pipe' });
} catch(e) {}
