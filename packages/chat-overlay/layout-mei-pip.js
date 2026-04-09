// Resize and reposition Mei Avatar into a bottom-right "picture-in-picture" cam
// and make sure the Kick Overlay is full-screen behind everything.
import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();
await obs.connect('ws://localhost:4455');

// Get canvas size
const { baseWidth, baseHeight } = await obs.call('GetVideoSettings');
console.log(`Canvas: ${baseWidth}x${baseHeight}`);

// Find current program scene
const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
console.log(`Scene: ${currentProgramSceneName}`);

// List scene items in the current scene
const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: currentProgramSceneName });
console.log('Scene items:');
for (const it of sceneItems) {
  console.log(`  - ${it.sourceName} (id=${it.sceneItemId}) enabled=${it.sceneItemEnabled}`);
}

async function setTransform(sourceName, transform) {
  const item = sceneItems.find(i => i.sourceName === sourceName);
  if (!item) {
    console.log(`⚠️  ${sourceName} not in scene, skipping`);
    return;
  }
  await obs.call('SetSceneItemTransform', {
    sceneName: currentProgramSceneName,
    sceneItemId: item.sceneItemId,
    sceneItemTransform: transform,
  });
  console.log(`✅ ${sourceName}:`, transform);
}

async function setOrder(sourceName, index) {
  const item = sceneItems.find(i => i.sourceName === sourceName);
  if (!item) return;
  await obs.call('SetSceneItemIndex', {
    sceneName: currentProgramSceneName,
    sceneItemId: item.sceneItemId,
    sceneItemIndex: index,
  });
}

// ─── 1. Kick Overlay: full screen, behind everything ───
// Crop nothing, stretch to canvas.
await setTransform('Kick Overlay', {
  positionX: 0,
  positionY: 0,
  scaleX: baseWidth / 1280,   // assuming source renders at 1280x720
  scaleY: baseHeight / 720,
  boundsType: 'OBS_BOUNDS_STRETCH',
  boundsWidth: baseWidth,
  boundsHeight: baseHeight,
  boundsAlignment: 0,
  alignment: 5,
  cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0,
});
await setOrder('Kick Overlay', 0); // bottom of stack

// ─── 2. Mei Avatar: small PiP bottom-right, ~25% width ───
const meiWidth = Math.round(baseWidth * 0.26);   // ~500 px on 1920
const meiHeight = Math.round(meiWidth * 9 / 16); // 16:9
const margin = 40;
await setTransform('Mei Avatar', {
  positionX: baseWidth - meiWidth - margin,
  positionY: baseHeight - meiHeight - margin - 60, // 60px leaves room for bottom ticker
  boundsType: 'OBS_BOUNDS_SCALE_INNER',
  boundsWidth: meiWidth,
  boundsHeight: meiHeight,
  boundsAlignment: 0,
  alignment: 5,
  cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0,
});

// ─── 3. MoltAvatar (duplicate): disable — it's redundant ───
const molt = sceneItems.find(i => i.sourceName === 'MoltAvatar');
if (molt) {
  await obs.call('SetSceneItemEnabled', {
    sceneName: currentProgramSceneName,
    sceneItemId: molt.sceneItemId,
    sceneItemEnabled: false,
  });
  console.log('✅ MoltAvatar disabled (redundant)');
}

// ─── 4. Music Layer: keep as-is, just make sure it's on top ───
// (Music layer is usually audio-only or tiny UI)

await obs.disconnect();
console.log('\n✅ Layout applied');
