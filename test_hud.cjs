const fs = require('fs');
let out = fs.readFileSync('ugui_hud_builder_tmp.cs', 'utf8');

const lines = out.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('? \"')) {
        console.log(`LINE ${i+1}: ${lines[i]}`);
    }
}
