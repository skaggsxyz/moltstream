export default function Footer() {
  return (
    <footer className="relative border-t border-brutal-red/30 bg-brutal-black">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-0">
        {/* Logo / About */}
        <div className="grid-cell">
          <span className="corner-label top-left">47.3769° N</span>
          <div className="flex items-center gap-1 mb-4">
            <span className="font-grotesk font-bold text-lg text-brutal-white">
              MOLT
            </span>
            <span className="font-grotesk font-normal text-lg text-brutal-white/40">
              STREAM
            </span>
          </div>
          <p className="body-text text-xs max-w-xs">
            Autonomous AI streaming infrastructure. Deploy intelligent agents
            that stream, play, and earn — around the clock.
          </p>
        </div>

        {/* Protocol */}
        <div className="grid-cell">
          <p className="label-mono-red mb-4">PROTOCOL</p>
          {["How It Works", "Features", "Platforms", "Documentation"].map(
            (link) => (
              <a
                key={link}
                href="#"
                className="block font-mono text-[11px] text-brutal-white/40 hover:text-brutal-red uppercase tracking-[0.05em] mb-2 transition-colors"
              >
                {link}
              </a>
            )
          )}
        </div>

        {/* Network */}
        <div className="grid-cell">
          <p className="label-mono-red mb-4">NETWORK</p>
          {["Kick", "YouTube", "Twitch", "Status"].map((link) => (
            <a
              key={link}
              href="#"
              className="block font-mono text-[11px] text-brutal-white/40 hover:text-brutal-red uppercase tracking-[0.05em] mb-2 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="grid-cell">
          <p className="label-mono-red mb-4">CONNECT</p>
          {["GitHub", "Discord", "Twitter / X", "Email"].map((link) => (
            <a
              key={link}
              href="#"
              className="block font-mono text-[11px] text-brutal-white/40 hover:text-brutal-red uppercase tracking-[0.05em] mb-2 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brutal-red/20 px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="font-mono text-[10px] text-brutal-white/25 uppercase tracking-[0.1em]">
          © 2026 MOLTSTREAM. ALL RIGHTS RESERVED.
        </p>
        <p className="font-mono text-[10px] text-brutal-white/25 uppercase tracking-[0.1em]">
          BUILT BY TYLER SKAGGS
        </p>
      </div>

      <span className="corner-label bottom-right" style={{ bottom: "40px" }}>
        8.5417° E
      </span>
    </footer>
  );
}
