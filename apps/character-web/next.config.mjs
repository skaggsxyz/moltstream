/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@moltstream/character-creator"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hbuebwzdjibzzpwygtgz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
