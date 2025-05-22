/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdf-parse ve diğer node modülleri için yapılandırma
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      child_process: false
    };
    
    return config;
  },
  experimental: {},
  serverExternalPackages: ['pdf-parse']
};

module.exports = nextConfig; 