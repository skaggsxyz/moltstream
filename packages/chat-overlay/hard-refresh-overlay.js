import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();
await obs.connect('ws://localhost:4455');

const targets = ['Kick Overlay', 'MoltAvatar'];
for (const name of targets) {
  try {
    const { inputSettings } = await obs.call('GetInputSettings', { inputName: name });
    const baseUrl = (inputSettings.url || 'http://localhost:3939/').split('?')[0];
    const newUrl = `${baseUrl}?v=${Date.now()}`;
    await obs.call('SetInputSettings', {
      inputName: name,
      inputSettings: { url: newUrl },
      overlay: true,
    });
    console.log(`✅ ${name} → ${newUrl}`);
  } catch (e) {
    console.log(`⚠️  ${name}: ${e.message}`);
  }
}

// Also force refresh on all browser sources
const { inputs } = await obs.call('GetInputList');
for (const i of inputs) {
  if (i.inputKind === 'browser_source' && targets.includes(i.inputName)) {
    try {
      await obs.call('PressInputPropertiesButton', {
        inputName: i.inputName,
        propertyName: 'refreshnocache',
      });
      console.log(`✅ refresh button pressed: ${i.inputName}`);
    } catch (e) {
      console.log(`⚠️  refresh ${i.inputName}: ${e.message}`);
    }
  }
}

await obs.disconnect();
