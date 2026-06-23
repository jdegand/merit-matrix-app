import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <-- Tells Next.js to build a static site
  basePath: '/merit-matrix-app',
  images: {
    unoptimized: true, // <-- Required by GitHub Pages for static asset handling
  },
};

export default nextConfig;
