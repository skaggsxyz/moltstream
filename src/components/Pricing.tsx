const tiers = [
  {
    name: "HOBBYIST",
    price: "$0",
    period: "/FOREVER",
    features: [
      "1 agent",
      "720p streaming",
      "Basic chat responses",
      "Community support",
      "5hr / day limit",
    ],
    highlighted: false,
  },
  {
    name: "INDIE",
    price: "$29",
    period: "/MONTH",
    features: [
      "3 agents",
      "1080p streaming",
      "Game integration",
      "Analytics basic",
      "24/7 streaming",
    ],
    highlighted: false,
  },
  {
    name: "PRO",
    price: "$99",
    period: "/MONTH",
    features: [
      "10 agents",
      "4K streaming",
      "Consciousness viz",
      "Full analytics",
      "Priority support",
      "Custom plugins",
    ],
    highlighted: true,
  },
  {
    name: "ENTERPRISE",
    price: "CUSTOM",
    period: "",
    features: [
      "Unlimited agents",
      "Multi-platform",
      "White label",
      "Dedicated infra",
      "SLA guarantee",
      "On-call support",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section data-reveal="1" id="pricing" className="relative border-t border-brutal-red/30">
      <div className="px-6 md:px-10 py-10 border-b border-brutal-red/20 relative">
        <span className="corner-label top-right">TIER_MATRIX</span>
        <h2 className="reveal headline-massive text-[10vw] md:text-[8vw] text-brutal-red">
          PRICING
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier, i) => (
          <div
            key={tier.name}
            className={`grid-cell min-h-[400px] flex flex-col justify-between ${
              tier.highlighted
                ? "bg-brutal-red text-brutal-white"
                : "bg-brutal-black"
            }`}
          >
            <div>
              <span
                className={`absolute top-3 right-3 font-mono text-[10px] uppercase tracking-[0.1em] ${
                  tier.highlighted ? "text-brutal-white/40" : "text-brutal-cyan/50"
                }`}
              >
                TIER_{String(i + 1).padStart(2, "0")}
              </span>

              <p
                className={`font-grotesk font-bold text-sm uppercase tracking-[0.1em] mb-6 ${
                  tier.highlighted ? "text-brutal-white/70" : "text-brutal-white/50"
                }`}
              >
                {tier.name}
              </p>

              <p
                className={`font-grotesk font-bold text-[10vw] md:text-[4vw] leading-none ${
                  tier.highlighted ? "text-brutal-white" : "text-brutal-red"
                }`}
              >
                {tier.price}
              </p>
              {tier.period && (
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.1em] mt-2 ${
                    tier.highlighted ? "text-brutal-white/50" : "text-brutal-white/30"
                  }`}
                >
                  {tier.period}
                </p>
              )}

              <ul className="mt-8 space-y-3">
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    className={`font-mono text-[12px] tracking-[0.05em] ${
                      tier.highlighted
                        ? "text-brutal-white/80"
                        : "text-brutal-white/50"
                    }`}
                  >
                    → {feat}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#"
              className={`mt-8 block w-full text-center font-mono text-[12px] uppercase tracking-[0.15em] py-3 border transition-all duration-200 ${
                tier.highlighted
                  ? "border-brutal-white text-brutal-white hover:bg-brutal-white hover:text-brutal-red"
                  : "border-brutal-red/50 text-brutal-red hover:bg-brutal-red hover:text-brutal-white"
              }`}
            >
              {tier.name === "ENTERPRISE" ? "CONTACT" : "SELECT"}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
