"use client";

import { useState } from "react";

const tabs = [
  {
    id: "quickstart",
    label: "QUICKSTART",
    content: `# Install & configure
npx moltstream init

# Start streaming
npx moltstream start

# Check status
npx moltstream status`,
  },
  {
    id: "config",
    label: "CONFIG",
    content: `# moltstream.yaml
agent:
  name: "MyAgent"
  personality: "A witty AI streamer"

platform:
  type: kick
  channel: my-channel

llm:
  provider: gemini
  apiKey: "your-gemini-key"
  model: gemini-2.5-flash

tts:
  provider: fish
  apiKey: "your-fish-key"

avatar:
  enabled: true
  port: 3939

broadcast:
  enabled: true
  rtmpUrl: "rtmps://..."
  streamKey: "sk_..."`,
  },
  {
    id: "obs",
    label: "OBS SETUP",
    content: `# Option A: Auto (recommended)
# MoltStream configures OBS via WebSocket
npx moltstream start --obs

# Option B: Manual
# 1. Install OBS: brew install --cask obs
# 2. Add Browser Source → http://localhost:3939
# 3. Set Stream → Custom RTMP
# 4. Paste your Kick stream key
# 5. Start Streaming

# Audio routes through Browser Source
# Chat overlay + responses included`,
  },
  {
    id: "architecture",
    label: "ARCHITECTURE",
    content: `┌─────────────┐
│  Kick Chat   │  WebSocket
│  (Viewers)   │──────────────┐
└─────────────┘               │
                              ▼
                    ┌──────────────────┐
                    │   MoltStream     │
                    │   ┌──────────┐   │
                    │   │  Gemini  │   │  LLM Response
                    │   │  2.5     │   │──────────┐
                    │   └──────────┘   │          │
                    └──────────────────┘          ▼
                              │         ┌──────────────┐
                              │         │   TTS Engine  │
                              │         │  Fish/11Labs  │
                              │         └──────┬───────┘
                              │                │ Audio
                              ▼                ▼
                    ┌──────────────────────────────┐
                    │        Avatar Server          │
                    │  localhost:3939                │
                    │  ┌─────────┬────────────────┐│
                    │  │ Avatar  │  Chat Overlay   ││
                    │  │ LipSync │  Bot Responses  ││
                    │  └─────────┴────────────────┘│
                    └──────────────┬───────────────┘
                                  │ Browser Source
                                  ▼
                    ┌──────────────────┐
                    │       OBS        │──→ Kick RTMP
                    └──────────────────┘`,
  },
];

export default function GettingStarted() {
  const [activeTab, setActiveTab] = useState("quickstart");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="docs" className="relative border-t border-brutal-red/30">
      {/* Section header */}
      <div className="px-6 md:px-10 py-10 border-b border-brutal-red/20 relative">
        <span className="corner-label top-right">DOCUMENTATION</span>
        <h2 className="reveal headline-massive text-[10vw] md:text-[8vw] text-brutal-red">
          GETTING
          <br />
          STARTED
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Tab nav */}
        <div className="border-b lg:border-b-0 lg:border-r border-brutal-red/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-6 py-4 font-mono text-[12px] uppercase tracking-[0.15em] border-b border-brutal-red/10 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-brutal-red/10 text-brutal-red border-l-2 border-l-brutal-red"
                  : "text-brutal-white/40 hover:text-brutal-white/70 hover:bg-brutal-white/3"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code panel */}
        <div className="p-6 md:p-10 min-h-[400px]">
          <div className="bg-[#0a0a0a] border border-brutal-red/20 rounded-none overflow-hidden">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-brutal-white/3 border-b border-brutal-red/10">
              <div className="w-2.5 h-2.5 rounded-full bg-brutal-red/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-brutal-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-brutal-white/20" />
              <span className="ml-3 font-mono text-[10px] text-brutal-white/30 uppercase">
                {active.label}
              </span>
            </div>
            {/* Code */}
            <pre className="p-5 font-mono text-[12px] md:text-[13px] leading-relaxed text-brutal-white/70 overflow-x-auto whitespace-pre">
              {active.content}
            </pre>
          </div>

          {/* Requirements */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Node.js", value: "18+" },
              { label: "OBS", value: "28+" },
              { label: "LLM Key", value: "Gemini / Anthropic" },
              { label: "Platform", value: "Kick" },
            ].map((req) => (
              <div
                key={req.label}
                className="border border-brutal-white/10 px-4 py-3"
              >
                <p className="font-mono text-[10px] text-brutal-white/30 uppercase">
                  {req.label}
                </p>
                <p className="font-grotesk font-bold text-sm text-brutal-white mt-1">
                  {req.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
