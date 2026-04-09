import OBSWebSocket from 'obs-websocket-js';
const obs = new OBSWebSocket();
await obs.connect('ws://localhost:4455');
const { inputs } = await obs.call('GetInputList');
console.log('All inputs:');
for (const i of inputs) {
  console.log(`  - ${i.inputName} (${i.inputKind})`);
  if (i.inputKind === 'browser_source') {
    const { inputSettings } = await obs.call('GetInputSettings', { inputName: i.inputName });
    console.log(`      url: ${inputSettings.url}`);
  }
}
await obs.disconnect();
