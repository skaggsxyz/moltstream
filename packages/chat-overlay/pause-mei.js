import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();
await obs.connect('ws://localhost:4455');

const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: currentProgramSceneName });

const mei = sceneItems.find(i => i.sourceName === 'Mei Avatar');
if (!mei) {
  console.log('❌ Mei Avatar not in scene');
} else {
  await obs.call('SetSceneItemEnabled', {
    sceneName: currentProgramSceneName,
    sceneItemId: mei.sceneItemId,
    sceneItemEnabled: false,
  });
  console.log('✅ Mei Avatar disabled (hidden from scene)');
}

// Also point the source URL to about:blank so WebRTC session tears down
// and stops eating anam minutes. Save original URL for restore.
const { inputSettings } = await obs.call('GetInputSettings', { inputName: 'Mei Avatar' });
console.log('Current Mei URL:', inputSettings.url);

await obs.call('SetInputSettings', {
  inputName: 'Mei Avatar',
  inputSettings: { url: 'about:blank' },
  overlay: true,
});
console.log('✅ Mei Avatar URL → about:blank (session torn down, anam minutes saved)');

await obs.disconnect();
