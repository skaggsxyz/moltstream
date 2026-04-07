# MoltStream

**Launch Your AI Streamer in 5 Minutes**

The first platform to deploy autonomous AI agents that stream 24/7 on Twitch, YouTube, and Kick. No code required.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Fonts:** Inter + JetBrains Mono
- **Deployment:** Static export ready

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles + animations
│   ├── layout.tsx           # Root layout + SEO metadata
│   └── page.tsx             # Main landing page
├── components/
│   ├── Navbar.tsx           # Fixed navigation
│   ├── Hero.tsx             # Hero section with code rain
│   ├── HowItWorks.tsx       # 3-step process
│   ├── Features.tsx         # 6-card feature grid
│   ├── Stats.tsx            # Social proof / stats
│   ├── Platforms.tsx        # Supported platforms
│   ├── Pricing.tsx          # 4-tier pricing
│   ├── FAQ.tsx              # Accordion FAQ
│   └── Footer.tsx           # Footer with links
└── hooks/
    └── useReveal.ts         # Intersection Observer hook
```

## Features

- 🎨 Dark terminal/hacker aesthetic
- 📱 Fully responsive (mobile-first)
- ⚡ Pure CSS animations (no heavy libraries)
- 🔍 SEO optimized with Open Graph tags
- ♿ Accessible markup
- 🚀 Static — no external API calls

## License

MIT

## Author

Built by [Tyler Skaggs](https://github.com/skaggsxyz)
