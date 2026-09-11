const fs = require('fs');
let out = fs.readFileSync('editor_log.txt', 'utf8');

const lines = out.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Error') || lines[i].includes('error')) {
        console.log(`L${i+1}: ${lines[i]}`);
    }
}
