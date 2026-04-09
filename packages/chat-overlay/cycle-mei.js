/**
 * Hard cycle Mei Avatar source: disable → wait → enable + refresh
 * This kills any orphaned WebRTC connection so anam frees the concurrency slot.
 */
import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();
const SCENE = 'Scene';
const SOURCE = 'Mei Avatar';

await obs.connect('ws://localhost:4455');
const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: SCENE });
const item = sceneItems.find((i) => i.sourceName === SOURCE);
if (!item) {
  console.error(`Source "${SOURCE}" not found`);
  process.exit(1);
}

console.log('Disabling Mei Avatar source...');
await obs.call('SetSceneItemEnabled', {
  sceneName: SCENE,
  sceneItemId: item.sceneItemId,
  sceneItemEnabled: false,
});

// Set URL to about:blank to fully tear down WebRTC
console.log('Setting URL to about:blank...');
await obs.call('SetInputSettings', {
  inputName: SOURCE,
  inputSettings: { url: 'about:blank' },
  overlay: true,
});

await obs.call('PressInputPropertiesButton', {
  inputName: SOURCE,
  propertyName: 'refreshnocache',
});

console.log('Waiting 35s for anam to release the session...');
await new Promise((r) => setTimeout(r, 35000));

console.log('Restoring URL to Mei page...');
await obs.call('SetInputSettings', {
  inputName: SOURCE,
  inputSettings: {
    url: 'http://localhost:3939/mei',
    width: 1280,
    height: 720,
    fps: 30,
    shutdown: false,
    restart_when_active: false,  // CRITICAL: do NOT reload on scene activation
    reroute_audio: true,
  },
  overlay: true,
});

console.log('Re-enabling source...');
await obs.call('SetSceneItemEnabled', {
  sceneName: SCENE,
  sceneItemId: item.sceneItemId,
  sceneItemEnabled: true,
});

await obs.call('PressInputPropertiesButton', {
  inputName: SOURCE,
  propertyName: 'refreshnocache',
});

console.log('✅ Mei cycled');
await obs.disconnect();
