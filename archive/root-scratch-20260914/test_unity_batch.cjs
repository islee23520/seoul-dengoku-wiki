const { execSync } = require('child_process');
try {
  execSync('ssh desktop "cd E:/git/seoul-kenshi-wt/rtfc-phase-d && E:/Unity/Editor/6000.7.0a5/Editor/Unity.exe -batchmode -quit -projectPath \\"$PWD/Game\\" -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer"', { stdio: 'inherit' });
} catch (e) {
  console.log("Unity batchmode exited with error", e.status);
}
