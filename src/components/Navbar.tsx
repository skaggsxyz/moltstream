export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-brutal-black/95 backdrop-blur-sm border-b border-brutal-red/30 flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center gap-3">
        <img src="https://hbuebwzdjibzzpwygtgz.supabase.co/storage/v1/object/public/assets/logo.jpg" alt="MoltStream" className="w-8 h-8" style={{ imageRendering: "pixelated" }} />
        <div className="flex items-center gap-1">
          <span className="font-grotesk font-bold text-lg text-brutal-white tracking-tight">
            MOLT
          </span>
          <span className="font-grotesk font-normal text-lg text-brutal-white/50 tracking-tight">
            STREAM
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {["PROTOCOL", "FEATURES", "LIVE", "CREATOR", "DOCS"].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-brutal-white/40 hover:text-brutal-red transition-colors duration-200"
          >
            {link}
          </a>
        ))}
        <span className="font-mono text-[10px] text-brutal-red/50 tracking-[0.1em]">
          v0.7.0
        </span>
        <a
          href="https://x.com/skaggsxyz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-brutal-white/40 hover:text-brutal-white transition-colors duration-200 border border-brutal-white/10 hover:border-brutal-white/30 px-3 py-1.5"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>@SKAGGSXYZ</span>
        </a>
      </div>
    </nav>
  );
}

