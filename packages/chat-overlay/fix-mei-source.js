/**
 * Fix Mei Avatar Browser Source to prevent auto-restart loops.
 */
import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();
await obs.connect('ws://localhost:4455');

await obs.call('SetInputSettings', {
  inputName: 'Mei Avatar',
  inputSettings: {
    url: 'http://localhost:3939/mei',
    width: 1280,
    height: 720,
    fps: 30,
    shutdown: false,
    restart_when_active: false,  // ← KEY FIX — don't reload on scene activation
    reroute_audio: true,
  },
  overlay: true,
});

console.log('✅ Mei Avatar source fixed: restart_when_active=false');
await obs.disconnect();
