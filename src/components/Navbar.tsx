export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-brutal-black/95 backdrop-blur-sm border-b border-brutal-red/30 flex items-center justify-between px-6 md:px-10">
      <div className="flex items-center gap-3">
        <img src="/logo.jpg" alt="MoltStream" className="w-8 h-8" style={{ imageRendering: "pixelated" }} />
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
      </div>
    </nav>
  );
}
