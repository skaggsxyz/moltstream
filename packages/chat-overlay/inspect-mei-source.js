import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();
await obs.connect('ws://localhost:4455');
const settings = await obs.call('GetInputSettings', { inputName: 'Mei Avatar' });
console.log(JSON.stringify(settings, null, 2));
await obs.disconnect();
