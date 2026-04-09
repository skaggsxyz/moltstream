/**
 * Add Mei avatar Browser Source to OBS
 */
import OBSWebSocket from 'obs-websocket-js';

const OBS_URL = 'ws://localhost:4455';
const MEI_URL = 'http://localhost:3939/mei';
const SOURCE_NAME = 'Mei Avatar';

const obs = new OBSWebSocket();

async function main() {
  try {
    console.log('[obs] Connecting...');
    await obs.connect(OBS_URL);
    console.log('[obs] Connected');

    const { currentProgramSceneName } = await obs.call('GetSceneList');
    const targetScene = currentProgramSceneName;
    console.log(`[obs] Scene: ${targetScene}`);

    const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: targetScene });
    const existing = sceneItems.find((item) => item.sourceName === SOURCE_NAME);

    if (existing) {
      console.log(`[obs] Source "${SOURCE_NAME}" exists, updating settings...`);
      await obs.call('SetInputSettings', {
        inputName: SOURCE_NAME,
        inputSettings: {
          url: MEI_URL,
          width: 1280,
          height: 720,
          fps: 30,
          shutdown: false,
          restart_when_active: false,
          reroute_audio: true,
        },
        overlay: true,
      });
      console.log('[obs] ✅ Updated existing source settings');
    } else {
      console.log(`[obs] Creating Mei Browser Source at ${MEI_URL}`);
      await obs.call('CreateInput', {
        sceneName: targetScene,
        inputName: SOURCE_NAME,
        inputKind: 'browser_source',
        inputSettings: {
          url: MEI_URL,
          width: 1280,
          height: 720,
          fps: 30,
          shutdown: false,
          restart_when_active: false,
          reroute_audio: true,
        },
      });
      console.log('[obs] ✅ Browser Source created');
    }

    // Position + size on canvas (centered, 1280x720 area)
    const { sceneItems: updatedItems } = await obs.call('GetSceneItemList', { sceneName: targetScene });
    const item = updatedItems.find((i) => i.sourceName === SOURCE_NAME);
    if (item) {
      await obs.call('SetSceneItemTransform', {
        sceneName: targetScene,
        sceneItemId: item.sceneItemId,
        sceneItemTransform: {
          positionX: 320,
          positionY: 180,
          scaleX: 1.0,
          scaleY: 1.0,
          boundsType: 'OBS_BOUNDS_SCALE_INNER',
          boundsAlignment: 0,
          boundsWidth: 1280,
          boundsHeight: 720,
        },
      });
      console.log('[obs] ✅ Positioned at (320, 180) — 1280x720');

      await obs.call('SetSceneItemEnabled', {
        sceneName: targetScene,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: true,
      });
    }

    // Refresh cache
    try {
      await obs.call('PressInputPropertiesButton', {
        inputName: SOURCE_NAME,
        propertyName: 'refreshnocache',
      });
      console.log('[obs] ✅ Cache refreshed');
    } catch {}

    console.log('\n[obs] ✅ DONE — Mei avatar added to OBS');
    await obs.disconnect();
  } catch (err) {
    console.error('[obs] Error:', err.message || err);
    process.exit(1);
  }
}

main();
