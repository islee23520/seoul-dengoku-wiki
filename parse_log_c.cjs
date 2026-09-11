const fs = require('fs');

try {
  let logStr = fs.readFileSync('editor_log.txt', 'utf8');
  let errCount = 0;
  logStr.split('\n').forEach((line, i) => {
    if (line.includes('error CS')) {
      console.log(`L${i+1}: ${line}`);
      errCount++;
    }
  });
  console.log(`Found ${errCount} CS errors`);
} catch(e) {}

