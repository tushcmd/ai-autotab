/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "/." : "",
  output: "export",
  // distDir: 'out',
  trailingSlash: true,
  // Disable image optimization since it's not needed for extensions
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
