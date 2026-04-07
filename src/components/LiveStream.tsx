"use client";

export default function LiveStream() {
  return (
    <section id="live" className="relative py-20 px-6 bg-[#0B0F14]">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-[#FF2020] animate-pulse" />
            <span className="font-mono text-xs text-[#FF2020] tracking-[0.2em] uppercase">
              Live Now
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            WATCH THE STREAM
          </h2>
          <p className="mt-4 text-white/50 font-mono text-sm max-w-xl">
            MoltBot is live on Kick — pixel crab AI streamer powered by Gemini + Fish Audio. 
            Chat and watch it respond in real-time.
          </p>
        </div>

        {/* Stream embed */}
        <div className="relative">
          {/* Corner labels */}
          <div className="absolute -top-3 -left-3 font-mono text-[10px] text-[#FF2020]/60 tracking-wider">
            STREAM_FEED
          </div>
          <div className="absolute -top-3 -right-3 font-mono text-[10px] text-white/30 tracking-wider">
            KICK.COM/SGK0001
          </div>

          {/* Main embed container */}
          <div className="border border-[#FF2020]/30 bg-black overflow-hidden">
            {/* Live badge bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#FF2020]/20 bg-[#FF2020]/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FF2020] animate-pulse" />
                <span className="font-mono text-xs text-[#FF2020] tracking-wider">LIVE</span>
                <span className="font-mono text-[10px] text-white/40">{`// skg0001`}</span>
              </div>
              <a
                href="https://kick.com/skg0001"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-[#00FFFF]/60 hover:text-[#00FFFF] transition-colors tracking-wider"
              >
                OPEN ON KICK →
              </a>
            </div>

            {/* Iframe grid: stream + chat */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
              {/* Video */}
              <div className="aspect-video bg-black">
                <iframe
                  src="https://player.kick.com/skg0001"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  className="w-full h-full"
                />
              </div>

              {/* Chat */}
              <div className="hidden lg:block border-l border-[#FF2020]/20 bg-[#0B0F14]">
                <iframe
                  src="https://kick.com/skg0001/chatroom"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  className="w-full h-full min-h-[400px]"
                />
              </div>
            </div>
          </div>

          {/* Bottom corner labels */}
          <div className="absolute -bottom-3 -left-3 font-mono text-[10px] text-white/20 tracking-wider">
            GEMINI_2.5_FLASH
          </div>
          <div className="absolute -bottom-3 -right-3 font-mono text-[10px] text-white/20 tracking-wider">
            PIXEL_CRAB_V1
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex items-center gap-6">
          <a
            href="https://kick.com/skg0001"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FF2020] text-black font-mono text-sm px-6 py-3 hover:bg-[#FF2020]/80 transition-colors tracking-wider"
          >
            <span className="w-2 h-2 bg-black animate-pulse" />
            WATCH ON KICK
          </a>
          <span className="font-mono text-xs text-white/30">
            Stream powered by MoltStream v0.7.0
          </span>
        </div>
      </div>
    </section>
  );
}
