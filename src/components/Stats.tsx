const stats = [
  { value: "30+", label: "COMMITS" },
  { value: "15", label: "PACKAGES" },
  { value: "6.5K", label: "LINES" },
  { value: "OSS", label: "OPEN SOURCE" },
];

export default function Stats() {
  return (
    <section data-reveal="1" className="relative bg-brutal-red border-t border-brutal-black/20">
      <div className="relative px-6 md:px-10 py-6">
        <span
          className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.1em]"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          DATA_READOUT
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-brutal-black/10 px-6 md:px-10 py-10 md:py-16 text-center"
          >
            <p className="font-grotesk font-bold text-[12vw] md:text-[8vw] lg:text-[6vw] text-brutal-white leading-none">
              {stat.value}
            </p>
            <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.15em] text-brutal-black mt-3 font-bold">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
