/**
 * Add Music layer Browser Source to OBS (audio only, tiny visible "Now Playing" badge)
 */
import OBSWebSocket from 'obs-websocket-js';

const OBS_URL = 'ws://localhost:4455';
const SOURCE = 'Music Layer';
const STATION = process.argv[2] || 'cyberpunk';
const VOL = process.argv[3] || '0.4';
const URL = `http://localhost:3939/music?station=${STATION}&vol=${VOL}`;

const obs = new OBSWebSocket();

try {
  await obs.connect(OBS_URL);
  const { currentProgramSceneName: scene } = await obs.call('GetSceneList');
  const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: scene });
  const existing = sceneItems.find((i) => i.sourceName === SOURCE);

  if (existing) {
    console.log(`[obs] Updating Music Layer URL → ${URL}`);
    await obs.call('SetInputSettings', {
      inputName: SOURCE,
      inputSettings: {
        url: URL,
        width: 600,
        height: 80,
        fps: 30,
        shutdown: false,
        restart_when_active: true,
        reroute_audio: true,
      },
      overlay: true,
    });
  } else {
    console.log(`[obs] Creating Music Layer Browser Source → ${URL}`);
    await obs.call('CreateInput', {
      sceneName: scene,
      inputName: SOURCE,
      inputKind: 'browser_source',
      inputSettings: {
        url: URL,
        width: 600,
        height: 80,
        fps: 30,
        shutdown: false,
        restart_when_active: true,
        reroute_audio: true,
      },
    });
  }

  const { sceneItems: updated } = await obs.call('GetSceneItemList', { sceneName: scene });
  const item = updated.find((i) => i.sourceName === SOURCE);
  if (item) {
    // Bottom-right corner
    await obs.call('SetSceneItemTransform', {
      sceneName: scene,
      sceneItemId: item.sceneItemId,
      sceneItemTransform: {
        positionX: 1300,
        positionY: 980,
        scaleX: 1,
        scaleY: 1,
      },
    });
    await obs.call('SetSceneItemEnabled', {
      sceneName: scene,
      sceneItemId: item.sceneItemId,
      sceneItemEnabled: true,
    });
  }

  await obs.call('PressInputPropertiesButton', {
    inputName: SOURCE,
    propertyName: 'refreshnocache',
  });

  console.log('[obs] ✅ Music Layer ready (station:', STATION + ', vol:', VOL + ')');
  await obs.disconnect();
} catch (err) {
  console.error('[obs] Error:', err.message || err);
  process.exit(1);
}
