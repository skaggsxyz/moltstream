const steps = [
  {
    num: "01",
    title: "INSTALL",
    cmd: "npx moltstream init",
    desc: "Interactive wizard: pick platform (Kick), set your LLM key (Gemini/Anthropic), configure TTS voice, and agent personality. Creates moltstream.yaml in 30 seconds.",
  },
  {
    num: "02",
    title: "START",
    cmd: "npx moltstream start",
    desc: "One command boots the entire pipeline: Chat listener → LLM → TTS → Avatar with lip sync → OBS → RTMP stream. Your AI agent goes live.",
  },
  {
    num: "03",
    title: "STREAM",
    cmd: "kick.com/your-agent",
    desc: "Your agent reads chat, generates responses via LLM, speaks with TTS, animates the avatar, and streams everything to Kick — fully autonomous, 24/7.",
  },
];

export default function HowItWorks() {
  return (
    <section data-reveal="1" id="protocol" className="relative border-t border-brutal-red/30">
      {/* Section header */}
      <div className="px-6 md:px-10 py-10 border-b border-brutal-red/20 relative">
        <span className="corner-label top-right">PROTOCOL_SEQUENCE</span>
        <h2 className="reveal headline-massive text-[10vw] md:text-[8vw] text-brutal-red">
          HOW IT<br />WORKS
        </h2>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.num} className="grid-cell min-h-[300px] flex flex-col justify-between">
            <div>
              <span className="corner-label-cyan">STEP_{step.num}</span>
              <p className="reveal headline-massive headline-outlined text-[6vw] md:text-[4vw] mb-6">
                {step.num}
              </p>
              <h3 className="font-grotesk font-bold text-xl text-brutal-red uppercase tracking-tight mb-3">
                {step.title}
              </h3>
              <div className="mb-4 bg-brutal-white/5 border border-brutal-red/30 px-4 py-2.5 font-mono text-[12px] text-brutal-white/70">
                <span className="text-brutal-red mr-2">$</span>{step.cmd}
              </div>
              <p className="body-text text-sm">{step.desc}</p>
            </div>
            <p className="label-mono mt-8">
              BLOCK: M-00{i + 1}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
