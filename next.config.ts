/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image domains if needed for external Pokemon card images
  images: {
    domains: ['images.pokemontcg.io'],
  },
  
};

module.exports = nextConfig;
