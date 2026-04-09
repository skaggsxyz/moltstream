import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();
try {
  await obs.connect('ws://localhost:4455');
  const { inputs } = await obs.call('GetInputList');
  const overlayInput = inputs.find(i =>
    /overlay|kick/i.test(i.inputName) && i.inputKind === 'browser_source'
  );
  if (!overlayInput) {
    console.error('❌ Kick Overlay browser source not found. Sources:');
    inputs.filter(i => i.inputKind === 'browser_source').forEach(i => console.log('  -', i.inputName));
  } else {
    await obs.call('PressInputPropertiesButton', {
      inputName: overlayInput.inputName,
      propertyName: 'refreshnocache',
    });
    console.log('✅ Refreshed:', overlayInput.inputName);
  }
  await obs.disconnect();
} catch (e) {
  console.error('OBS error:', e.message);
  process.exit(1);
}
