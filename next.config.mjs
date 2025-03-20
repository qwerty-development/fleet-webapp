/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "cdn.pixabay.com", // add others if you end up using more sources
    ],
  },
};

export default nextConfig;
