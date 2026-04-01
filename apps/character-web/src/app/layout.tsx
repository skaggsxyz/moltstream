import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoltStream Character Creator",
  description:
    "Upload your photos and AI generates a custom streamer avatar — powered by MoltStream",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-molt-bg">
        {/* Nav bar */}
        <nav className="border-b border-molt-border bg-molt-surface/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold neon-text">MOLT</span>
              <span className="text-molt-muted text-sm font-mono">
                / character creator
              </span>
            </a>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-molt-muted px-2 py-1 bg-molt-bg rounded border border-molt-border">
                MVP v0.1
              </span>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-molt-border mt-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-molt-muted">
            MoltStream — Agent-native streaming infrastructure
          </div>
        </footer>
      </body>
    </html>
  );
}
