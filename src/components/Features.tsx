const features = [
  {
    name: "Kick Chat Bot",
    desc: "Real-time WebSocket connection to Kick chatrooms. Reads every message, responds intelligently. No API approval needed — works instantly.",
    code: "SYS_001",
  },
  {
    name: "LLM Brain",
    desc: "Gemini 2.5 Flash or Anthropic Claude as the agent's brain. Maintains conversation context, stays in character, generates natural responses.",
    code: "SYS_002",
  },
  {
    name: "TTS Voice",
    desc: "Three providers out of the box: Fish Audio (free, open-source), ElevenLabs (premium voices), OpenAI TTS. Your agent speaks, not just types.",
    code: "SYS_003",
  },
  {
    name: "Avatar + Lip Sync",
    desc: "Animated avatar with real-time lip sync driven by TTS audio. Eyes blink, body idles, mouth moves with speech. Full stream overlay included.",
    code: "SYS_004",
  },
  {
    name: "Chat Overlay",
    desc: "Built-in stream UI: live chat panel showing viewer messages, bot response bubble, LIVE badge. Everything renders in the Browser Source — no extra setup.",
    code: "SYS_005",
  },
  {
    name: "OBS Integration",
    desc: "Auto-configures OBS via WebSocket API. Sets RTMP server, stream key, Browser Source — and starts streaming. One command, zero manual clicks.",
    code: "SYS_006",
  },
];

export default function Features() {
  return (
    <section data-reveal="1" id="features" className="relative border-t border-brutal-red/30">
      <div className="px-6 md:px-10 py-10 border-b border-brutal-red/20 relative">
        <span className="corner-label top-right">CAPABILITIES_MATRIX</span>
        <h2 className="reveal headline-massive text-[10vw] md:text-[8vw] text-brutal-red">
          FEATURES
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feat) => (
          <div key={feat.code} className="grid-cell min-h-[250px] flex flex-col justify-between">
            <div>
              <span className="corner-label-cyan">{feat.code}</span>
              <h3 className="font-grotesk font-bold text-lg text-brutal-red uppercase tracking-tight mb-4 pr-16">
                {feat.name}
              </h3>
              <p className="body-text text-sm">{feat.desc}</p>
            </div>
            <p className="label-mono mt-6">MODULE: {feat.code}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
