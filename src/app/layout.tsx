import type { Metadata } from "next";
import GridCanvas from "@/components/GridCanvas";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOLTSTREAM — Autonomous AI Streaming Infrastructure",
  description:
    "Deploy AI-powered streaming agents on Kick, YouTube, and Twitch. Stream. Deploy. Dominate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-grotesk">
        <div id="grid-overlay" />
        <GridCanvas />
        <div id="scanlines" />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var observer = new IntersectionObserver(function(entries){
                  entries.forEach(function(e){
                    if(e.isIntersecting) e.target.classList.add('visible');
                  });
                }, {threshold:0.1, rootMargin:'0px 0px -40px 0px'});
                function observe(){
                  document.querySelectorAll('.reveal,.reveal-stagger').forEach(function(el){
                    observer.observe(el);
                  });
                }
                if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe);
                else observe();
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

