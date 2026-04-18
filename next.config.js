/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static HTML export for Vercel / GitHub Pages
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
