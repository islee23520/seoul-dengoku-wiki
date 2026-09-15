const fs = require('fs');

function checkFile(filename) {
    const lines = fs.readFileSync(filename, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('? \"')) {
            console.log(`${filename}:${i+1}: ${lines[i]}`);
        }
    }
}

checkFile('snapshot_tmp.cs');
checkFile('ugui_hud_builder_tmp.cs');
