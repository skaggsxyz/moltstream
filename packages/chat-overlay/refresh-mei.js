import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();
try {
  await obs.connect('ws://localhost:4455');
  await obs.call('PressInputPropertiesButton', {
    inputName: 'Mei Avatar',
    propertyName: 'refreshnocache',
  });
  console.log('✅ Mei Avatar refreshed');
  await obs.disconnect();
} catch (err) {
  console.error('Error:', err.message || err);
  process.exit(1);
}
