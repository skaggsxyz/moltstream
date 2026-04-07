const platforms = [
  { name: "KICK", split: 95, creator: 95, platform: 5 },
  { name: "YOUTUBE", split: 70, creator: 70, platform: 30 },
  { name: "TWITCH", split: 55, creator: 55, platform: 45 },
];

export default function Platforms() {
  return (
    <section data-reveal="1" id="platforms" className="relative border-t border-brutal-red/30">
      <div className="px-6 md:px-10 py-10 border-b border-brutal-red/20 relative">
        <span className="corner-label top-right">DISTRIBUTION_NETWORK</span>
        <h2 className="reveal headline-massive text-[10vw] md:text-[8vw] text-brutal-red">
          PLATFORMS
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {platforms.map((p) => (
          <div key={p.name} className="grid-cell min-h-[280px] flex flex-col justify-between">
            <div>
              <span className="corner-label-cyan">NET_{p.name.slice(0, 3)}</span>
              <h3 className="font-grotesk font-bold text-[8vw] md:text-[3.5vw] text-brutal-white uppercase tracking-tight leading-none mb-6">
                {p.name}
              </h3>

              {/* Revenue split label */}
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brutal-white/40 mb-3">
                Creator / Platform split
              </p>

              {/* Revenue bar */}
              <div className="w-full h-3 bg-brutal-white/10 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-brutal-red"
                  style={{ width: `${p.creator}%` }}
                />
              </div>

              {/* Split numbers */}
              <div className="flex justify-between mt-3">
                <span className="font-grotesk font-bold text-3xl text-brutal-red">
                  {p.creator}%
                </span>
                <span className="font-grotesk font-bold text-3xl text-brutal-white/20">
                  {p.platform}%
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="label-mono">CREATOR</span>
                <span className="label-mono">PLATFORM</span>
              </div>
            </div>

            <p className="label-mono mt-8">ROUTE: {p.name}_PRIMARY</p>
          </div>
        ))}
      </div>
    </section>
  );
}
