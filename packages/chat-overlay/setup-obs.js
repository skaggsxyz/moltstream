/**
 * Auto-configure OBS: add Browser Source with Kick overlay + autofit
 */
import OBSWebSocket from 'obs-websocket-js';

const OBS_URL = 'ws://localhost:4455';
const OVERLAY_URL = 'http://localhost:3939';
const SOURCE_NAME = 'Kick Overlay';
const SCENE_NAME = 'Scene';

const obs = new OBSWebSocket();

async function main() {
  try {
    console.log('[obs] Connecting...');
    const { obsWebSocketVersion } = await obs.connect(OBS_URL);
    console.log(`[obs] Connected, version ${obsWebSocketVersion}`);

    // Get current scene list
    const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
    console.log(`[obs] Current scene: ${currentProgramSceneName}`);
    console.log(`[obs] Scenes: ${scenes.map((s) => s.sceneName).join(', ')}`);

    const targetScene = currentProgramSceneName || SCENE_NAME;

    // Check if source already exists in this scene
    const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: targetScene });
    const existing = sceneItems.find((item) => item.sourceName === SOURCE_NAME);

    if (existing) {
      console.log(`[obs] Source "${SOURCE_NAME}" already exists (id=${existing.sceneItemId}), updating...`);
      // Update settings
      await obs.call('SetInputSettings', {
        inputName: SOURCE_NAME,
        inputSettings: {
          url: OVERLAY_URL,
          width: 1920,
          height: 1080,
          fps: 30,
          shutdown: false,
          restart_when_active: true,
          reroute_audio: false,
        },
        overlay: true,
      });
      console.log('[obs] ✅ Updated existing source settings');
    } else {
      console.log(`[obs] Creating new Browser Source: ${SOURCE_NAME}`);
      await obs.call('CreateInput', {
        sceneName: targetScene,
        inputName: SOURCE_NAME,
        inputKind: 'browser_source',
        inputSettings: {
          url: OVERLAY_URL,
          width: 1920,
          height: 1080,
          fps: 30,
          shutdown: false,
          restart_when_active: true,
          reroute_audio: false,
        },
      });
      console.log('[obs] ✅ Browser Source created');
    }

    // Find the scene item id for transform
    const { sceneItems: updatedItems } = await obs.call('GetSceneItemList', { sceneName: targetScene });
    const item = updatedItems.find((i) => i.sourceName === SOURCE_NAME);
    if (item) {
      // Reset transform to fill canvas
      await obs.call('SetSceneItemTransform', {
        sceneName: targetScene,
        sceneItemId: item.sceneItemId,
        sceneItemTransform: {
          positionX: 0,
          positionY: 0,
          scaleX: 1.0,
          scaleY: 1.0,
          boundsType: 'OBS_BOUNDS_SCALE_INNER',
          boundsAlignment: 0,
          boundsWidth: 1920,
          boundsHeight: 1080,
        },
      });
      console.log('[obs] ✅ Transform set to fill 1920x1080');

      // Make sure it's visible and on top
      await obs.call('SetSceneItemEnabled', {
        sceneName: targetScene,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: true,
      });
      console.log('[obs] ✅ Source enabled');
    }

    // Force refresh the browser cache
    try {
      await obs.call('PressInputPropertiesButton', {
        inputName: SOURCE_NAME,
        propertyName: 'refreshnocache',
      });
      console.log('[obs] ✅ Browser cache refreshed');
    } catch (e) {
      console.log('[obs] (refresh button not available, skipping)');
    }

    console.log('\n[obs] ✅ DONE — Kick overlay is live in OBS');
    await obs.disconnect();
  } catch (err) {
    console.error('[obs] Error:', err.message || err);
    process.exit(1);
  }
}

main();
