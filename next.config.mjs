/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'enka.network',
        pathname: '/ui/**',
      },
    ],
  },
};

export default nextConfig;
