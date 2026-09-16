const { execSync } = require('child_process');
const output = execSync('ssh desktop "cd E:/git/seoul-kenshi-wt/rtfc-phase-d && E:/Unity/Editor/6000.7.0a5/Editor/Unity.exe -batchmode -quit -projectPath \\"$PWD/Game\\" -executeMethod Janseon.Art.Editor.UiCandidateShowcase.Import"', { encoding: 'utf8', stdio: 'pipe' });
console.log(output);
