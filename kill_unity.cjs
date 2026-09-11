const { execSync } = require('child_process');
execSync('ssh desktop "powershell -Command \\"Get-Process | Where-Object { $_.ProcessName -match \'Unity\' } | Stop-Process -Force\\""', { encoding: 'utf8', stdio: 'pipe' });
